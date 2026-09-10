import "server-only";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import mammoth from "mammoth";
import ExcelJS from "exceljs";
import { PDFParse } from "pdf-parse";
import { GoogleGenAI } from "@google/genai";
import { getGeminiKey } from "@/lib/settings";

async function ocrPdf(data: Buffer) {
  const key = await getGeminiKey();
  if (!key) throw new Error("This PDF appears scanned. Configure Gemini first to enable OCR.");
  const ai = new GoogleGenAI({ apiKey: key });
  const result = await ai.models.generateContent({
    model: process.env.GEMINI_SUMMARY_MODEL ?? "gemini-2.5-flash",
    contents: [
      { inlineData: { mimeType: "application/pdf", data: data.toString("base64") } },
      { text: "Extract all readable text from this document faithfully. Preserve headings and table rows. Return text only." },
    ],
  });
  return result.text ?? "";
}

export async function parseDocument(path: string, originalName: string) {
  const ext = extname(originalName).toLowerCase();
  const data = await readFile(path);
  if (ext === ".txt" || ext === ".csv") return data.toString("utf8");
  if (ext === ".doc" || ext === ".xls") throw new Error("Legacy DOC/XLS is not supported. Convert the file to DOCX/XLSX first.");
  if (ext === ".docx") return (await mammoth.extractRawText({ buffer: data })).value;
  if (ext === ".xlsx") {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(data as unknown as ExcelJS.Buffer);
    const rows: string[] = [];
    workbook.eachSheet((sheet) => {
      rows.push(`# ${sheet.name}`);
      sheet.eachRow((row) => {
        const cells = Array.isArray(row.values) ? row.values.slice(1) : Object.values(row.values);
        rows.push(cells.map((value) => typeof value === "object" && value && "text" in value ? String(value.text) : String(value ?? "")).join(" | "));
      });
    });
    return rows.join("\n");
  }
  if (ext === ".pdf") {
    const parser = new PDFParse({ data });
    try {
      const result = await parser.getText();
      const text = result.text.trim();
      return text.length > 100 ? text : await ocrPdf(data);
    } finally {
      await parser.destroy();
    }
  }
  throw new Error("Supported files are PDF, DOCX, XLSX, TXT and CSV");
}
