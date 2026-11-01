// Shared type definitions for the application

export interface User {
  _id?: string;
  userName: string;
  email: string;
  password?: string;
  createdAt?: Date;
}

export interface EmailRecipient {
  email: string;
  name?: string;
  [key: string]: any;
}

export interface EmailBatchRequest {
  user: string;
  fromEmail: string;
  xlsxData: string;
  subject: string;
  text: string;
  contact: string;
  linkenIn?: string;
}

export interface EmailJobData {
  fromEmail: string;
  toEmail: string;
  name: string;
  subject: string;
  htmlContent: string;
  attachments?: AttachmentData[];
  jobId: string;
  batchId: string;
}

export interface AttachmentData {
  filename: string;
  path: string;
  contentType?: string;
}

export interface BatchProgress {
  batchId: string;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  status: "queued" | "processing" | "completed" | "failed";
  startTime: Date;
  endTime?: Date;
  estimatedCompletion?: Date;
}

export interface EmailResult {
  email: string;
  status: string;
  error?: string;
  messageId?: string;
}

export interface AISubjectRequest {
  emailContent: string;
  context?: string;
}

export interface AIEnhanceRequest {
  text: string;
  tone?: string;
  purpose?: string;
}

export interface AIAnalysisRequest {
  emailContent: string;
}

export interface AISubjectResponse {
  subjects: string[];
  count: number;
  message: string;
}

export interface AIEnhanceResponse {
  enhanced: string;
  improvements: string[];
  originalLength: number;
  enhancedLength: number;
  tone: string;
  purpose: string;
  message: string;
}

export interface AIAnalysisResponse {
  score: number;
  feedback: string[];
  strengths: string[];
  suggestions: string[];
  contentLength: number;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RateLimitStatus {
  minute: {
    count: number;
    limit: number;
    resetIn: number;
  };
  daily: {
    count: number;
    limit: number;
    resetIn: number;
  };
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
}
