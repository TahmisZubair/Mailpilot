import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

const redis = new Redis({
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  host: process.env.REDIS_HOST || 'localhost',
  password: process.env.REDIS_PASSWORD || undefined,
});

const GMAIL_LIMITS = {
  QUOTA_UNITS_PER_SECOND: 250,
  QUOTA_UNITS_PER_USER_PER_SECOND: 250,
  DAILY_QUOTA_LIMIT: 1000000000, 
  EMAIL_SEND_QUOTA: 1, 
};

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const emailSendRateLimit = rateLimit({
  windowMs: 60 * 1000, 
  max: 50, 
  message: {
    error: 'Too many email send requests, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const userEmailRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.method !== 'POST' || !req.body) {
      next();
      return;
    }

    const { fromEmail } = req.body;
    
    if (!fromEmail) {
      next();
      return;
    }

    try {
      await redis.ping();
    } catch (redisError) {
      console.warn('Redis not available, skipping user rate limiting:', redisError);
      next();
      return;
    }

    const userKey = `email_rate_limit:${fromEmail}`;
    const dailyKey = `daily_email_limit:${fromEmail}`;

    const currentMinuteCount = await redis.get(userKey) || '0';
    const dailyCount = await redis.get(dailyKey) || '0';
    
    const DAILY_EMAIL_LIMIT = 2000;
    const MINUTE_EMAIL_LIMIT = 250;
    
    if (parseInt(dailyCount) >= DAILY_EMAIL_LIMIT) {
      res.status(429).json({
        error: 'Daily email limit exceeded',
        limit: DAILY_EMAIL_LIMIT,
        current: parseInt(dailyCount),
        resetTime: 'Tomorrow at midnight UTC'
      });
      return;
    }
    
    if (parseInt(currentMinuteCount) >= MINUTE_EMAIL_LIMIT) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        limit: MINUTE_EMAIL_LIMIT,
        current: parseInt(currentMinuteCount),
        resetTime: '1 minute'
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    res.status(500).json({ 
      error: 'Rate limiting service unavailable',
      details: 'Please try again later'
    });
  }
};

export const incrementUserEmailCount = async (fromEmail: string, emailCount: number = 1) => {
  try {
    const userKey = `email_rate_limit:${fromEmail}`;
    const dailyKey = `daily_email_limit:${fromEmail}`;

    const pipeline = redis.pipeline();
    pipeline.incr(userKey);
    pipeline.expire(userKey, 60);

    pipeline.incr(dailyKey);
    const secondsUntilMidnight = getSecondsUntilMidnight();
    pipeline.expire(dailyKey, secondsUntilMidnight);
    
    await pipeline.exec();
    
    console.log(`Incremented email count for ${fromEmail}: +${emailCount}`);
  } catch (error) {
    console.error('Error incrementing email count:', error);
  }
};

export const getUserRateLimitStatus = async (fromEmail: string) => {
  try {
    const userKey = `email_rate_limit:${fromEmail}`;
    const dailyKey = `daily_email_limit:${fromEmail}`;
    
    const [minuteCount, dailyCount, minuteTTL, dailyTTL] = await Promise.all([
      redis.get(userKey),
      redis.get(dailyKey),
      redis.ttl(userKey),
      redis.ttl(dailyKey)
    ]);
    
    return {
      minute: {
        count: parseInt(minuteCount || '0'),
        limit: 250,
        resetIn: minuteTTL > 0 ? minuteTTL : 0
      },
      daily: {
        count: parseInt(dailyCount || '0'),
        limit: 2000,
        resetIn: dailyTTL > 0 ? dailyTTL : 0
      }
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return null;
  }
};

export const calculateOptimalDelay = async (fromEmail: string, batchSize: number): Promise<number> => {
  try {
    const status = await getUserRateLimitStatus(fromEmail);
    
    if (!status) return 1000;
    
    const minuteUsagePercent = status.minute.count / status.minute.limit;
    const dailyUsagePercent = status.daily.count / status.daily.limit;
  
    let delay = batchSize * 100;
 
    if (minuteUsagePercent > 0.8) {
      delay *= 2;
    }
    
    if (dailyUsagePercent > 0.9) {
      delay *= 3;
    }

    return Math.max(500, Math.min(delay, 10000));
    
  } catch (error) {
    console.error('Error calculating delay:', error);
    return 1000; 
  }
};

export const getOptimalBatchSize = async (fromEmail: string): Promise<number> => {
  try {
    const status = await getUserRateLimitStatus(fromEmail);
    
    if (!status) return 10; 
    
    const minuteRemaining = status.minute.limit - status.minute.count;
    const dailyRemaining = status.daily.limit - status.daily.count;

    const maxBatch = Math.min(minuteRemaining, Math.min(dailyRemaining, 50));

    if (status.minute.count / status.minute.limit > 0.8) {
      return Math.min(maxBatch, 5);
    }
    
    return Math.min(maxBatch, 10);
    
  } catch (error) {
    console.error('Error calculating batch size:', error);
    return 10; 
  }
};

function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0); 
  
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

export const cleanupRateLimitData = async () => {
  try {
    const keys = await redis.keys('email_rate_limit:*');
    const dailyKeys = await redis.keys('daily_email_limit:*');
    
    const expiredKeys = [];
    
    for (const key of [...keys, ...dailyKeys]) {
      const ttl = await redis.ttl(key);
      if (ttl === -1) { 
        expiredKeys.push(key);
      }
    }
    
    if (expiredKeys.length > 0) {
      await redis.del(...expiredKeys);
      console.log(`Cleaned up ${expiredKeys.length} expired rate limit keys`);
    }
  } catch (error) {
    console.error('Error cleaning up rate limit data:', error);
  }
};

export default {
  apiRateLimit,
  emailSendRateLimit,
  userEmailRateLimit,
  incrementUserEmailCount,
  getUserRateLimitStatus,
  calculateOptimalDelay,
  getOptimalBatchSize,
  cleanupRateLimitData
};