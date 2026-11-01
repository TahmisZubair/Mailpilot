export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

export const validateRequiredFields = (
  fields: Record<string, any>
): { isValid: boolean; missingFields: string[] } => {
  const missingFields = Object.entries(fields)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

export const validateTextLength = (
  text: string,
  maxLength: number,
  fieldName: string = "Text"
): { isValid: boolean; error?: string } => {
  if (text.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be less than ${maxLength} characters`,
    };
  }
  return { isValid: true };
};

export const validateFileSize = (
  fileSize: number,
  maxSizeMB: number = 10
): { isValid: boolean; error?: string } => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (fileSize > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }
  return { isValid: true };
};

export const validateFileType = (
  mimeType: string,
  fileName: string
): { isValid: boolean; error?: string } => {
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv", // .csv
  ];

  const isValidType =
    allowedTypes.includes(mimeType) || fileName.endsWith(".csv");

  if (!isValidType) {
    return {
      isValid: false,
      error: "File must be a valid Excel (.xlsx, .xls) or CSV file",
    };
  }

  return { isValid: true };
};
