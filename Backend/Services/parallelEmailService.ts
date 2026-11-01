import { v4 as uuidv4 } from "uuid";
import { addEmailBatch, getBatchStatus } from "./emailQueueService";
import {
  incrementUserEmailCount,
  calculateOptimalDelay,
  getOptimalBatchSize,
} from "./rateLimitService";
import { getRecipientName, createEmailHTML } from "./emailContentService";
import { EmailRecipient, EmailJobData, BatchProgress } from "../Types";

interface SendEmailOptions {
  fromEmail: string;
  user: string;
  subject: string;
  text: string;
  contact: string;
  linkedIn?: string;
  attachments?: any[];
  concurrency?: number;
  batchSize?: number;
}

const batchProgressMap = new Map<string, BatchProgress>();

export async function sendEmailsInParallel(
  emailData: EmailRecipient[],
  options: SendEmailOptions
): Promise<{ batchId: string; message: string }> {
  const batchId = uuidv4();
  const startTime = new Date();

  const batchProgress: BatchProgress = {
    batchId,
    total: emailData.length,
    processed: 0,
    successful: 0,
    failed: 0,
    status: "queued",
    startTime,
  };

  batchProgressMap.set(batchId, batchProgress);

  try {
    console.log(
      `Starting parallel email processing for batch ${batchId} with ${emailData.length} emails`
    );

    const optimalBatchSize = await getOptimalBatchSize(options.fromEmail);
    const batchSize = options.batchSize || optimalBatchSize;

    console.log(`Using batch size: ${batchSize}`);

    const emailJobs: EmailJobData[] = emailData.map((recipient, index) => {
      const name = getRecipientName(recipient);
      const toEmail = recipient.email;

      if (!toEmail) {
        throw new Error(`No email found for recipient at index ${index}`);
      }

      const htmlContent = createEmailHTML(
        options.text,
        name,
        options.user,
        options.contact,
        options.linkedIn
      );

      return {
        fromEmail: options.fromEmail,
        toEmail,
        name,
        subject: options.subject,
        htmlContent,
        attachments: options.attachments || [],
        jobId: `${batchId}-${index}`,
        batchId,
      };
    });

    batchProgress.status = "processing";
    batchProgressMap.set(batchId, batchProgress);

    const delay = await calculateOptimalDelay(options.fromEmail, batchSize);
    console.log(`Using delay between batches: ${delay}ms`);

    const jobs = await addEmailBatch(emailJobs, batchSize, delay);

    console.log(
      `Successfully queued ${jobs.length} email jobs in batch ${batchId}`
    );

    await incrementUserEmailCount(options.fromEmail, emailData.length);

    const estimatedTimePerEmail = 2000;
    const estimatedCompletion = new Date(
      startTime.getTime() + emailData.length * estimatedTimePerEmail
    );
    batchProgress.estimatedCompletion = estimatedCompletion;
    batchProgressMap.set(batchId, batchProgress);

    return {
      batchId,
      message: `Email batch queued successfully. ${emailData.length} emails will be processed in batches of ${batchSize}.`,
    };
  } catch (error: any) {
    console.error(`Error processing email batch ${batchId}:`, error);

    batchProgress.status = "failed";
    batchProgress.endTime = new Date();
    batchProgressMap.set(batchId, batchProgress);

    throw new Error(`Failed to process email batch: ${error.message}`);
  }
}

export async function getBatchProgress(
  batchId: string
): Promise<BatchProgress & { results?: any[] }> {
  console.log(`Looking for batch: ${batchId}`);
  console.log(`Available batches:`, Array.from(batchProgressMap.keys()));

  const progress = batchProgressMap.get(batchId);

  if (!progress) {
    console.log(`Batch ${batchId} not found in memory, checking queue...`);

    if (batchId.startsWith("direct-")) {
      console.log(`Direct batch ${batchId} - returning completed status`);
      return {
        batchId,
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        status: "completed",
        startTime: new Date(),
        results: [],
      };
    }

    try {
      const { getBatchStatus } = await import("./emailQueueService");
      const queueResults = await getBatchStatus(batchId);

      console.log(`Queue results for ${batchId}:`, queueResults);

      if (queueResults && queueResults.length > 0) {
        const completed = queueResults.filter(
          (r) => r.status === "sent" || r.status === "failed"
        ).length;
        const successful = queueResults.filter(
          (r) => r.status === "sent"
        ).length;
        const failed = queueResults.filter((r) => r.status === "failed").length;

        return {
          batchId,
          total: queueResults.length,
          processed: completed,
          successful,
          failed,
          status:
            completed === queueResults.length ? "completed" : "processing",
          startTime: new Date(),
          results: queueResults,
        };
      }
    } catch (queueError: any) {
      console.log("Queue lookup also failed:", queueError.message);
    }

    throw new Error(`Batch ${batchId} not found`);
  }

  try {
    let results: any[] = [];
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempts + 1))); // 500ms, 1s, 1.5s
      results = await getBatchStatus(batchId);

      const successful = results.filter((r) => r.status === "sent").length;
      console.log(
        `Attempt ${attempts + 1}: Found ${successful}/${
          results.length
        } completed jobs`
      );

      if (successful === results.length && results.length > 0) {
        console.log(`All jobs completed on attempt ${attempts + 1}`);
        break;
      }

      attempts++;
    }

    console.log(`Final queue results for ${batchId}:`, results);

    const processed = results.filter((r) => r.status !== "waiting").length;
    const successful = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const stillProcessing = results.filter(
      (r) => r.status === "processing"
    ).length;

    console.log(
      `Final status counts: processed=${processed}, successful=${successful}, failed=${failed}, processing=${stillProcessing}`
    );

    progress.processed = processed;
    progress.successful = successful;
    progress.failed = failed;

    if (successful === progress.total) {
      progress.status = "completed";
      progress.endTime = new Date();
    } else if (stillProcessing > 0 || processed > 0) {
      progress.status = "processing";
    }

    batchProgressMap.set(batchId, progress);

    return {
      ...progress,
      results,
    };
  } catch (error) {
    console.error(`Error getting batch progress for ${batchId}:`, error);
    return progress;
  }
}

export function getAllBatches(): BatchProgress[] {
  return Array.from(batchProgressMap.values());
}

export function cleanupOldBatches(maxAgeHours: number = 24): void {
  const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  for (const [batchId, progress] of batchProgressMap.entries()) {
    if (progress.startTime < cutoffTime && progress.status === "completed") {
      batchProgressMap.delete(batchId);
      console.log(`Cleaned up old batch: ${batchId}`);
    }
  }
}

export default {
  sendEmailsInParallel,
  getBatchProgress,
  getAllBatches,
  cleanupOldBatches,
};
