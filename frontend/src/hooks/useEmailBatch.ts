import { useState, useCallback } from "react";
import { BASE_URL } from "../config";

interface EmailBatchState {
  batchId: string | null;
  isLoading: boolean;
  progress: number;
  status: "idle" | "sending" | "processing" | "completed" | "failed";
  results: Array<{ email: string; status: string }>;
  error: string | null;
}

interface SendBatchOptions {
  fromEmail: string;
  user: string;
  subject: string;
  text: string;
  contact: string;
  linkedIn?: string;
  xlsxData: string;
  attachments?: File[];
}

export const useEmailBatch = () => {
  const [batchState, setBatchState] = useState<EmailBatchState>({
    batchId: null,
    isLoading: false,
    progress: 0,
    status: "idle",
    results: [],
    error: null,
  });

  const sendBatch = useCallback(async (options: SendBatchOptions) => {
    setBatchState((prev) => ({
      ...prev,
      isLoading: true,
      status: "sending",
      error: null,
    }));

    try {
      const formData = new FormData();
      formData.append("fromEmail", options.fromEmail);
      formData.append("user", options.user);
      formData.append("subject", options.subject);
      formData.append("text", options.text);
      formData.append("contact", options.contact);
      if (options.linkedIn) formData.append("linkenIn", options.linkedIn);
      formData.append("xlsxData", options.xlsxData);

      if (options.attachments) {
        options.attachments.forEach((file) => {
          formData.append("attachments", file);
        });
      }

      const response = await fetch(`${BASE_URL}/api/sendmail`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.status === 202) {
        setBatchState((prev) => ({
          ...prev,
          batchId: data.batchId,
          status:
            data.status === "completed"
              ? "completed"
              : data.status === "queued"
              ? "processing"
              : "processing",
          isLoading: false,
          progress: data.status === "completed" ? 100 : 0,
          results: data.results || [],
        }));
        return data.batchId;
      } else {
        throw new Error(data.error || "Failed to send emails");
      }
    } catch (error: any) {
      setBatchState((prev) => ({
        ...prev,
        isLoading: false,
        status: "failed",
        error: error.message,
      }));
      throw error;
    }
  }, []);

  const trackProgress = useCallback(async (batchId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/batch-status/${batchId}`);
      const data = await response.json();

      if (response.ok) {
        console.log("Batch status data:", data);

        setBatchState((prev) => {
          const newState = {
            ...prev,
            progress: data.progressPercentage || 0,
            results: data.results || [],
            status:
              data.status === "completed"
                ? "completed"
                : data.status === "failed"
                ? "failed"
                : "processing",
          };

          console.log("Updated batchState with results:", newState);

          return newState;
        });

        console.log("Results array from API:", data.results);

        return data;
      } else {
        if (!data || Object.keys(data).length === 0) {
          console.warn("Empty batch status response, stopping polling");
          throw new Error("Empty response - batch may be completed");
        }
        console.error("Batch status error:", data);
        throw new Error(data.error || "Failed to get batch status");
      }
    } catch (error: any) {
      console.error("Track progress error:", error);
      setBatchState((prev) => ({
        ...prev,
        error: error.message,
        status: "failed",
      }));
      throw error;
    }
  }, []);

  const resetBatch = useCallback(() => {
    setBatchState({
      batchId: null,
      isLoading: false,
      progress: 0,
      status: "idle",
      results: [],
      error: null,
    });
  }, []);

  return {
    ...batchState,
    sendBatch,
    trackProgress,
    resetBatch,
  };
};
