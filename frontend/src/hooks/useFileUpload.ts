import { useState, useCallback } from "react";
import { BASE_URL } from "../config";

interface FileUploadState {
  isLoading: boolean;
  error: string | null;
  data: any[];
}

export const useFileUpload = () => {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    isLoading: false,
    error: null,
    data: [],
  });

  const uploadFile = useCallback(async (file: File): Promise<any[]> => {
    if (!file) {
      throw new Error("No file provided");
    }

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".csv")) {
      throw new Error("Please upload a valid Excel (.xlsx, .xls) or CSV file");
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("File size must be less than 10MB");
    }

    setUploadState({ isLoading: true, error: null, data: [] });

    try {
      const formData = new FormData();
      formData.append("files", file);

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      const serialKeys = ["sno", "S.No", "SNO", "SNo"];
      const hasSerialAlready =
        data.length > 0 && serialKeys.some((key) => key in data[0]);

      const dataWithSerial = hasSerialAlready
        ? data
        : data.map((row: any, index: number) => ({
            sno: index + 1,
            ...row,
          }));

      setUploadState({
        isLoading: false,
        error: null,
        data: dataWithSerial,
      });

      return dataWithSerial;
    } catch (error: any) {
      setUploadState({
        isLoading: false,
        error: error.message,
        data: [],
      });
      throw error;
    }
  }, []);

  const validateFileData = useCallback(
    (
      data: any[]
    ): {
      isValid: boolean;
      errors: string[];
      validCount: number;
      invalidCount: number;
    } => {
      const errors: string[] = [];
      let validCount = 0;
      let invalidCount = 0;

      if (!data || data.length === 0) {
        errors.push("No data found in file");
        return { isValid: false, errors, validCount: 0, invalidCount: 0 };
      }

      const hasEmailColumn = data.some(
        (row) => row.email || row.Email || row.EMAIL
      );

      if (!hasEmailColumn) {
        errors.push('File must contain an "email" column');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      data.forEach((row, index) => {
        const email = row.email || row.Email || row.EMAIL;
        if (email && emailRegex.test(email)) {
          validCount++;
        } else {
          invalidCount++;
          if (errors.length < 5) {
            errors.push(`Row ${index + 1}: Invalid or missing email`);
          }
        }
      });

      if (validCount === 0) {
        errors.push("No valid email addresses found");
      }

      return {
        isValid: errors.length === 0 && validCount > 0,
        errors,
        validCount,
        invalidCount,
      };
    },
    []
  );

  const clearData = useCallback(() => {
    setUploadState({
      isLoading: false,
      error: null,
      data: [],
    });
  }, []);

  const clearError = useCallback(() => {
    setUploadState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...uploadState,
    uploadFile,
    validateFileData,
    clearData,
    clearError,
  };
};
