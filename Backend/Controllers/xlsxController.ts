import multer from "multer";
import { Request, Response } from "express";
import { Express } from "express";
import ExcelJS from "exceljs";
import { validateFileSize, validateFileType } from "../Utils/validation";

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const uploadXlsx = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("=== XLSX UPLOAD FUNCTION CALLED ===");
  try {
    const files = req.files as Express.Multer.File[];
    console.log("Files received:", files ? files.length : 0);

    if (!files || files.length === 0) {
      console.log("ERROR: No files uploaded");
      res.status(400).json({ error: "No files uploaded" });
      return;
    }
    console.log("File validation starting...");

    for (const file of files) {
      const sizeValidation = validateFileSize(file.size);
      if (!sizeValidation.isValid) {
        res.status(400).json({
          error: `File ${file.originalname}: ${sizeValidation.error}`,
        });
        return;
      }

      const typeValidation = validateFileType(file.mimetype, file.originalname);
      if (!typeValidation.isValid) {
        res.status(400).json({
          error: `File ${file.originalname}: ${typeValidation.error}`,
        });
        return;
      }
    }

    const allData: any[] = [];

    for (const file of files) {
      try {
        const workbook = new ExcelJS.Workbook();

        if (
          file.mimetype === "text/csv" ||
          file.originalname.endsWith(".csv")
        ) {
          const csvData = file.buffer.toString("utf-8");
          const lines = csvData.split("\n").filter((line) => line.trim());

          if (lines.length === 0) {
            throw new Error(`File ${file.originalname} is empty`);
          }

          const headerRow = lines[0]
            .split(",")
            .map((h) => h.trim().replace(/"/g, ""));
          const dataRows = lines
            .slice(1)
            .map((line) =>
              line.split(",").map((cell) => cell.trim().replace(/"/g, ""))
            );

          const lowerHeaders = headerRow.map((h: string) => h.toLowerCase());

          if (!lowerHeaders.includes("email")) {
            throw new Error(
              `File ${file.originalname} must contain an 'email' column`
            );
          }

          const formattedData = dataRows
            .filter((row: string[]) =>
              row.some(
                (cell) => cell !== "" && cell !== null && cell !== undefined
              )
            )
            .map((row: string[]) => {
              const entry: Record<string, any> = {};
              lowerHeaders.forEach((key: string, idx: number) => {
                entry[key] = row[idx] || "";
              });
              return entry;
            });

          if (formattedData.length === 0) {
            throw new Error(
              `No valid data rows found in file ${file.originalname}`
            );
          }

          allData.push(...formattedData);
        } else {
          await workbook.xlsx.load(file.buffer);

          if (!workbook.worksheets || workbook.worksheets.length === 0) {
            throw new Error(`No sheets found in file ${file.originalname}`);
          }

          const worksheet = workbook.worksheets[0];

          if (!worksheet) {
            throw new Error(`Cannot read sheet from file ${file.originalname}`);
          }

          const rawData: any[][] = [];
          worksheet.eachRow((row, rowNumber) => {
            const rowData: any[] = [];
            row.eachCell((cell, colNumber) => {
              rowData[colNumber - 1] = cell.value;
            });
            rawData.push(rowData);
          });

          if (rawData.length === 0) {
            throw new Error(`File ${file.originalname} is empty`);
          }

          const [headerRow, ...dataRows] = rawData;

          if (!headerRow || headerRow.length === 0) {
            throw new Error(`No headers found in file ${file.originalname}`);
          }

          const lowerHeaders = headerRow.map((h: any) =>
            typeof h === "string"
              ? h.trim().toLowerCase()
              : String(h || "").toLowerCase()
          );

          // console.log('DEBUG - Headers found:', lowerHeaders);
          // console.log('DEBUG - First few data rows:', dataRows.slice(0, 3));

          if (!lowerHeaders.includes("email")) {
            throw new Error(
              `File ${file.originalname} must contain an 'email' column`
            );
          }

          const formattedData = dataRows
            .filter(
              (row: any[]) =>
                row &&
                row.some(
                  (cell) => cell !== "" && cell !== null && cell !== undefined
                )
            )
            .map((row: any[]) => {
              const entry: Record<string, any> = {};
              lowerHeaders.forEach((key: string, idx: number) => {
                let cellValue = row[idx] || "";

                // Handle Excel hyperlink objects
                if (
                  cellValue &&
                  typeof cellValue === "object" &&
                  cellValue.text
                ) {
                  cellValue = cellValue.text;
                }

                entry[key] = cellValue;
              });
              // console.log('DEBUG - Formatted entry:', entry);
              return entry;
            });

          if (formattedData.length === 0) {
            throw new Error(
              `No valid data rows found in file ${file.originalname}`
            );
          }

          allData.push(...formattedData);
        }
      } catch (fileError: any) {
        res.status(400).json({ error: fileError.message });
        return;
      }
    }

    if (allData.length === 0) {
      res.status(400).json({ error: "No valid data found in uploaded files" });
      return;
    }

    res.json(allData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process the uploaded files" });
  }
};
