import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import { getTransporter } from "./emailTransportService";
import { EmailJobData } from "../Types";

const redisConnection = {
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  host: process.env.REDIS_HOST || "localhost",
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

export const emailQueue = new Queue("email processing", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

export const emailWorker = new Worker(
  "email processing",
  async (job: Job<EmailJobData>) => {
    const {
      fromEmail,
      toEmail,
      name,
      subject,
      htmlContent,
      attachments,
      jobId,
    } = job.data;

    try {
      console.log(`Processing email job ${jobId} for ${toEmail}`);

      const transporter = await getTransporter(fromEmail);

      const mailOptions: any = {
        from: fromEmail,
        to: toEmail,
        subject,
        html: htmlContent,
      };

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments;
      }

      const result = await transporter.sendMail(mailOptions);

      console.log(
        `Email sent successfully to ${toEmail}, messageId: ${result.messageId}`
      );

      await job.updateProgress(100);

      return {
        status: "sent",
        email: toEmail,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error(`Failed to send email to ${toEmail}:`, error);

      const isRetryable = isRetryableError(error);

      if (!isRetryable) {
        throw new Error(`Permanent failure: ${error.message}`);
      }

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

function isRetryableError(error: any): boolean {
  const retryableErrors = [
    "ECONNRESET",
    "ENOTFOUND",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "Rate limit exceeded",
    "Quota exceeded",
  ];

  return retryableErrors.some(
    (retryableError) =>
      error.message?.includes(retryableError) ||
      error.code?.includes(retryableError)
  );
}

export async function addEmailToQueue(
  emailData: EmailJobData
): Promise<Job<EmailJobData>> {
  return emailQueue.add("send-email", emailData, {
    priority: 1,
    delay: 0,
  });
}

export async function addEmailBatch(
  emails: EmailJobData[],
  batchSize: number = 10,
  delayBetweenBatches: number = 1000
): Promise<Job<EmailJobData>[]> {
  const jobs: Job<EmailJobData>[] = [];

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    for (const email of batch) {
      const job = await addEmailToQueue(email);
      jobs.push(job);
    }

    if (i + batchSize < emails.length) {
      console.log(
        `Batch ${
          Math.floor(i / batchSize) + 1
        } queued, waiting ${delayBetweenBatches}ms before next batch...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return jobs;
}

export async function getQueueStats() {
  const counts = await emailQueue.getJobCounts(
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed"
  );

  return {
    waiting: counts.waiting || 0,
    active: counts.active || 0,
    completed: counts.completed || 0,
    failed: counts.failed || 0,
    delayed: counts.delayed || 0,
    total:
      (counts.waiting || 0) +
      (counts.active || 0) +
      (counts.completed || 0) +
      (counts.failed || 0) +
      (counts.delayed || 0),
  };
}

export async function getBatchStatus(batchId: string) {
  const jobs = await emailQueue.getJobs(
    ["waiting", "active", "completed", "failed"],
    0,
    -1
  );
  const batchJobs = jobs.filter(
    (job) => job.data && job.data.batchId === batchId
  );

  console.log(`Found ${batchJobs.length} jobs for batch ${batchId}`);

  const results = batchJobs.map((job) => {
    let status = "waiting";
    if (job.finishedOn) {
      status = job.failedReason ? "failed" : "sent";
    } else if (job.processedOn) {
      status = "processing";
    }

    console.log(
      `Job ${
        job.id
      }: finishedOn=${!!job.finishedOn}, processedOn=${!!job.processedOn}, failedReason=${!!job.failedReason}, status=${status}`
    );

    return {
      email: job.data.toEmail,
      status,
      error: job.failedReason || null,
      progress: job.progress || 0,
      attempts: job.attemptsMade || 0,
      messageId: job.returnvalue?.messageId || null,
    };
  });

  return results;
}

export async function cleanupQueue() {
  await emailQueue.clean(24 * 60 * 60 * 1000, 100, "completed");
  await emailQueue.clean(7 * 24 * 60 * 60 * 1000, 50, "failed");
}

emailWorker.on("completed", (job: Job<EmailJobData>, result: any) => {
  console.log(
    `Job ${job.id} completed for ${job.data.toEmail}: ${result.status}`
  );
});

emailWorker.on("failed", (job: Job<EmailJobData> | undefined, err: Error) => {
  const email = job?.data?.toEmail || "unknown";
  console.error(
    `Job ${job?.id || "unknown"} failed for ${email}:`,
    err.message
  );
});

emailWorker.on("stalled", (jobId: string) => {
  console.warn(`Job ${jobId} stalled`);
});

emailQueue.on("error", (err) => {
  console.error("Queue error:", err);
});

export async function closeQueue() {
  await emailWorker.close();
  await emailQueue.close();
}

export default emailQueue;
