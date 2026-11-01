import { EmailRecipient } from '../Types';
import { isValidEmail } from '../Utils/validation';

export function createEmailHTML(
    text: string, 
    name: string, 
    user: string, 
    contact: string, 
    linkedIn?: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 20px; font-size: 12px; color: #666;">
          <strong>Note:</strong> This email was sent via Mailpilot on behalf of ${user}. Please reply directly to this email to reach ${user}.
        </div>
        <p style="margin-bottom: 16px;">Dear ${name},</p>
        <div style="margin-bottom: 20px; line-height: 1.6;">
          ${text.replace(/\n/g, '<br>')}
        </div>
        <div style="margin-top: 24px;">
          <p style="margin-bottom: 8px;">Best Regards,<br><strong>${user}</strong></p>
          ${contact ? `<p style="margin-bottom: 8px;">Contact: ${contact}</p>` : ''}
          ${linkedIn ? `<p style="margin-bottom: 8px;"><a href="${linkedIn}" target="_blank" style="color: #0066cc; text-decoration: none;">Connect with me on LinkedIn</a></p>` : ''}
        </div>
      </div>
    `;
  }

export function validateEmailContent(text: string, subject: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!text || text.trim().length < 5) {
      errors.push('Email text must be at least 5 characters long');
    }

    if (!subject || subject.trim().length < 1) {
      errors.push('Subject is required');
    }

    if (text.length > 5000) {
      errors.push('Email text must be less than 5000 characters');
    }

    if (subject.length > 200) {
      errors.push('Subject must be less than 200 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }


export function normalizeRecipientData(rawData: any[]): EmailRecipient[] {
    return rawData.map((row: any) => {
      const normalizedRow: Record<string, any> = {};
      for (const key in row) {
        normalizedRow[key.toLowerCase()] = row[key];
      }
      return normalizedRow as EmailRecipient;
    });
  }


export function validateRecipients(recipients: EmailRecipient[]): { valid: EmailRecipient[]; invalid: any[] } {
    const valid: EmailRecipient[] = [];
    const invalid: any[] = [];

    recipients.forEach((recipient, index) => {
      const email = recipient.email;

      if (!email) {
        invalid.push({ index, reason: 'No email address found', data: recipient });
        return;
      }

      if (!isValidEmail(email)) {
        invalid.push({ index, reason: 'Invalid email format', email, data: recipient });
        return;
      }

      valid.push(recipient);
    });

    return { valid, invalid };
  }


export function getRecipientName(recipient: EmailRecipient): string {
    return recipient.name || recipient.Name || "Sir/Ma'am";
  }


export function createMailOptions(
    fromEmail: string,
    toEmail: string,
    subject: string,
    htmlContent: string,
    attachments?: any[]
  ): any {
    const mailOptions: any = {
      from: process.env.SMTP_USER, 
      replyTo: fromEmail,
      to: toEmail,
      subject,
      html: htmlContent,
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map((file) => ({
        filename: file.originalname || file.filename,
        path: file.path,
        contentType: file.mimetype || file.contentType
      }));
    }

    return mailOptions;
  }


export function sanitizeContent(content: string): string {
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
}