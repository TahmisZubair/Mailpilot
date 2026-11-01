import { userModel } from '../Models/userModel';
import nodemailer from "nodemailer";


export async function getTransporter(fromEmail: string): Promise<nodemailer.Transporter> {

    if (!fromEmail) {
      throw new Error("Email address is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromEmail)) {
      throw new Error("Invalid email format");
    }

    try {
      const userData = await userModel.findOne({ email: fromEmail });

      if (!userData) {
        throw new Error("User not found. Please login again.");
      }

      console.log('SMTP Config:', {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        user: process.env.SMTP_USER ? 'SET' : 'NOT SET',
        pass: process.env.SMTP_PASS ? 'SET' : 'NOT SET'
      });


      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false, 
        auth: {
          user: process.env.SMTP_USER || fromEmail,
          pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        }
      });

      return transporter;
    } catch (error: any) {
      console.error("Error creating transporter:", error);
      throw new Error(`Failed to create email transporter: ${error.message}`);
    }
  }


export async function verifyTransporter(transporter: nodemailer.Transporter): Promise<boolean> {
    try {
      await transporter.verify();
      return true;
    } catch (error) {
      console.error("Transporter verification failed:", error);
      return false;
    }
  }


export async function sendEmail(
  transporter: nodemailer.Transporter,
  mailOptions: nodemailer.SendMailOptions
): Promise<nodemailer.SentMessageInfo> {
    try {
      const result = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${mailOptions.to}, messageId: ${result.messageId}`);
      return result;
    } catch (error: any) {
      console.error(`Failed to send email to ${mailOptions.to}:`, error);
      throw error;
    }
}