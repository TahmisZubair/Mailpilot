import express from "express";
import { uploadXlsx, upload as memoryUpload } from "../Controllers/xlsxController";
import multer from 'multer';
import { userLogin, userSignup } from "../Controllers/authController";
import { sendMail, getBatchStatus } from "../Controllers/mailController";
import { apiRateLimit, emailSendRateLimit, userEmailRateLimit } from "../Services/rateLimitService";

const MailRouter = express.Router();
const diskUpload = multer({ dest: 'uploads/' });

// Apply general API rate limiting to all routes
MailRouter.use(apiRateLimit);

MailRouter.post("/upload", memoryUpload.array('files'), uploadXlsx);

// Email sending route with enhanced rate limiting
MailRouter.post("/sendmail", 
  emailSendRateLimit,
  userEmailRateLimit,
  diskUpload.array("attachments"), 
  sendMail
);

MailRouter.get("/batch-status/:batchId", getBatchStatus);

MailRouter.get("/queue-stats", async (req, res) => {
  try {
    const { getQueueStats } = await import("../Services/emailQueueService");
    const stats = await getQueueStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get queue stats", details: error.message });
  }
});

MailRouter.post("/signup", userSignup);

MailRouter.post("/login", userLogin);

export default MailRouter;