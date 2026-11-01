import { Request, Response } from "express";
import {
  validateEmailContent,
  normalizeRecipientData,
  validateRecipients,
} from "../Services/emailContentService";
import { EmailBatchRequest, EmailRecipient } from "../Types";
import { validateRequiredFields } from "../Utils/validation";
import fs from "fs";

const cleanupUploadedFiles = (
  files: Express.Multer.File[] | undefined
): void => {
  if (files && files.length > 0) {
    files.forEach((file) => {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Failed to delete uploaded file:", err);
      });
    });
  }
};

export const sendMail = async (req: Request, res: Response): Promise<void> => {
  console.log("=== SENDMAIL FUNCTION CALLED ===");
  const { user, fromEmail, xlsxData, subject, text, linkenIn, contact } =
    req.body;
  const files = req.files as Express.Multer.File[];

  console.log("Request body received:", {
    user,
    fromEmail,
    subject,
    hasXlsxData: !!xlsxData,
  });

  try {
    console.log("Validating required fields...");
    const requiredFieldsValidation = validateRequiredFields({
      fromEmail,
      xlsxData,
      subject,
      text,
      user,
    });

    if (!requiredFieldsValidation.isValid) {
      console.log("Validation failed:", requiredFieldsValidation.missingFields);
      res.status(400).json({
        error: `Missing required fields: ${requiredFieldsValidation.missingFields.join(
          ", "
        )}`,
      });
      return;
    }
    console.log("Required fields validation passed");

    console.log("Validating email content...");
    const contentValidation = validateEmailContent(text, subject);
    if (!contentValidation.isValid) {
      console.log("Email content validation failed:", contentValidation.errors);
      res.status(400).json({
        error: "Invalid email content",
        details: contentValidation.errors,
      });
      return;
    }
    console.log("Email content validation passed");

    console.log("Parsing Excel data...");
    let parsedData: any[] = [];
    try {
      const parsed = JSON.parse(xlsxData);
      console.log(
        "Parsed data type:",
        typeof parsed,
        "isArray:",
        Array.isArray(parsed)
      );
      if (!Array.isArray(parsed)) {
        console.log("ERROR: xlsxData is not an array");
        res.status(400).json({ error: "xlsxData must be an array." });
        return;
      }
      parsedData = parsed;
      console.log("Excel data parsed successfully, length:", parsedData.length);
    } catch (err) {
      console.log("ERROR: Failed to parse xlsxData:", err);
      res.status(400).json({ error: "Invalid xlsxData format." });
      return;
    }

    if (parsedData.length === 0) {
      console.log("ERROR: Excel data is empty");
      res.status(400).json({ error: "Excel data is empty!" });
      return;
    }

    console.log("Normalizing recipient data...");
    const normalizedData = normalizeRecipientData(parsedData);
    console.log("Validating recipients...");
    const { valid: validEmails, invalid: invalidEmails } =
      validateRecipients(normalizedData);
    console.log("Validation results:", {
      validCount: validEmails.length,
      invalidCount: invalidEmails.length,
    });

    if (validEmails.length === 0) {
      res.status(400).json({
        error: "No valid email addresses found in the data!",
        invalidEmails: invalidEmails.slice(0, 5),
      });
      return;
    }

    console.log(
      `Processing ${validEmails.length} valid emails, ${invalidEmails.length} invalid entries`
    );
    console.log("About to start email sending process...");

    let attachments: any[] = [];
    if (files && files.length > 0) {
      attachments = files.map((file) => ({
        filename: file.originalname,
        path: file.path,
        contentType: file.mimetype,
      }));
    }

    console.log("Starting email sending (with Redis fallback)...");

    try {
      const { getTransporter, verifyTransporter } = await import(
        "../Services/emailTransportService"
      );
      console.log("Testing SMTP connection...");
      const transporter = await getTransporter(fromEmail);
      const isVerified = await verifyTransporter(transporter);

      if (!isVerified) {
        res.status(500).json({
          error:
            "SMTP configuration is invalid. Please check your email settings.",
          totalEmails: validEmails.length,
          invalidEmails: invalidEmails.length,
        });
        return;
      }
      console.log("SUCCESS: SMTP connection verified!");

      try {
        const { sendEmailsInParallel } = await import(
          "../Services/parallelEmailService"
        );

        const emailOptions = {
          fromEmail,
          user,
          subject,
          text,
          contact,
          linkedIn: linkenIn,
          attachments,
          concurrency: 5,
          batchSize: 10,
        };

        console.log(
          `Attempting to queue ${validEmails.length} emails for background processing...`
        );
        const result = await sendEmailsInParallel(validEmails, emailOptions);

        console.log(`SUCCESS: Emails queued with batch ID: ${result.batchId}`);

        res.status(202).json({
          message: result.message,
          batchId: result.batchId,
          totalEmails: validEmails.length,
          invalidEmails: invalidEmails.length,
          status: "queued",
          statusCheckUrl: `/api/batch-status/${result.batchId}`,
          note: "Emails are being processed in the background. Use the batch ID to check progress.",
        });
      } catch (queueError: any) {
        console.warn(
          "Queue system failed, falling back to direct email sending:",
          queueError.message
        );

        const { createEmailHTML } = await import(
          "../Services/emailContentService"
        );

        const results = [];

        for (let i = 0; i < validEmails.length; i++) {
          const recipient = validEmails[i];
          const recipientName = recipient.name || recipient.Name || "Sir/Ma'am";

          console.log(
            `Sending email ${i + 1}/${validEmails.length} to: ${
              recipient.email
            }`
          );

          const htmlContent = createEmailHTML(
            text,
            recipientName,
            user,
            contact,
            linkenIn
          );
          const mailOptions = {
            from: fromEmail,
            to: recipient.email,
            subject,
            html: htmlContent,
            attachments,
          };

          try {
            const result = await transporter.sendMail(mailOptions);
            console.log(
              `SUCCESS: Email ${i + 1} sent to ${recipient.email}!`,
              result.messageId
            );
            results.push({
              email: recipient.email,
              status: "sent",
              messageId: result.messageId,
            });

            if (i < validEmails.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
            }
          } catch (emailError: any) {
            console.error(
              `FAILED: Email ${i + 1} to ${recipient.email}:`,
              emailError.message
            );
            results.push({
              email: recipient.email,
              status: "failed",
              error: emailError.message,
            });
          }
        }

        const successCount = results.filter((r) => r.status === "sent").length;
        const failedCount = results.filter((r) => r.status === "failed").length;

        res.status(202).json({
          message: `Emails processed directly: ${successCount} sent, ${failedCount} failed (Queue unavailable)`,
          batchId: `direct-${Date.now()}`,
          results,
          totalEmails: validEmails.length,
          invalidEmails: invalidEmails.length,
          status: "completed",
          note: "Emails were sent directly due to queue system being unavailable.",
        });
      }
    } catch (emailError: any) {
      console.error("ERROR: Email queuing failed:", emailError);
      console.error("Error details:", {
        name: emailError.name,
        message: emailError.message,
        code: emailError.code,
      });
      res.status(500).json({
        error: "Failed to queue emails for sending",
        details: emailError.message,
        totalEmails: validEmails.length,
        invalidEmails: invalidEmails.length,
      });
    }
  } catch (err: any) {
    console.error("Critical error:", err);
    console.error("Error stack:", err.stack);

    cleanupUploadedFiles(files);

    res.status(500).json({
      error: "Server error during email processing.",
      details: err.message,
    });
  }
};

export const getBatchStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      res.status(400).json({ error: "Batch ID is required" });
      return;
    }

    console.log(`Getting batch status for: ${batchId}`);

    const { getBatchProgress } = await import(
      "../Services/parallelEmailService"
    );
    const progress = await getBatchProgress(batchId);

    console.log(`Batch progress found:`, progress);

    res.status(200).json({
      ...progress,
      progressPercentage:
        progress.total > 0
          ? Math.round((progress.processed / progress.total) * 100)
          : 0,
    });
  } catch (err: any) {
    console.error("Error getting batch status:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    res.status(404).json({
      error: "Batch not found or error retrieving status",
      details: err.message || "Unknown error",
      batchId: req.params.batchId,
    });
    return;
  }
};
