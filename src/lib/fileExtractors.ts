// ============================================================
// FILE EXTRACTORS
// Converts raw binary/text files into normalized plain text
// for downstream classification and parsing.
//
// Supports: PDF, Excel (.xlsx/.xls), Word (.docx), CSV, plain text
// Falls back to empty string with an error on unsupported formats.
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import type { FileExtractionResult, IngestFileType } from '@/types/ingest';

// ── File type detection ────────────────────────────────────────

export function detectFileType(filePath: string): IngestFileType | null {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf':            return 'pdf';
    case '.xlsx':
    case '.xls':            return 'excel';
    case '.docx':
    case '.doc':            return 'word';
    case '.csv':            return 'csv';
    case '.txt':
    case '.md':             return 'text';
    default:                return null;
  }
}

// ── PDF extraction ─────────────────────────────────────────────

async function extractPdf(filePath: string): Promise<FileExtractionResult> {
  try {
    // Dynamic import keeps this from breaking the Next.js frontend bundle
    const pdfParse = (await import('pdf-parse')).default;
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer, {
      // Suppress test-file warning from pdf-parse
      max: 0,
    });
    const text = data.text ?? '';
    return {
      success: true,
      text: cleanExtractedText(text),
      file_type: 'pdf',
      char_count: text.length,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, text: '', file_type: 'pdf', char_count: 0, error: `PDF parse failed: ${msg}` };
  }
}

// ── Excel extraction ───────────────────────────────────────────

async function extractExcel(filePath: string): Promise<FileExtractionResult> {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.readFile(filePath, { cellText: true, cellDates: true });

    const sheets: Array<{ name: string; rows: string[][] }> = [];
    const textParts: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      const rows: string[][] = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: '',
        raw: false,
      }) as string[][];

      sheets.push({ name: sheetName, rows });

      // Flatten to text: "SheetName | col1 | col2 | ..."
      textParts.push(`=== Sheet: ${sheetName} ===`);
      for (const row of rows) {
        const rowStr = row
          .map(cell => String(cell ?? '').trim())
          .filter(Boolean)
          .join(' | ');
        if (rowStr) textParts.push(rowStr);
      }
    }

    const text = textParts.join('\n');
    return {
      success: true,
      text: cleanExtractedText(text),
      file_type: 'excel',
      char_count: text.length,
      sheets,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, text: '', file_type: 'excel', char_count: 0, error: `Excel parse failed: ${msg}` };
  }
}

// ── Word extraction (.docx) ────────────────────────────────────

async function extractWord(filePath: string): Promise<FileExtractionResult> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value ?? '';
    return {
      success: true,
      text: cleanExtractedText(text),
      file_type: 'word',
      char_count: text.length,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, text: '', file_type: 'word', char_count: 0, error: `Word parse failed: ${msg}` };
  }
}

// ── CSV extraction ─────────────────────────────────────────────

function extractCsv(filePath: string): FileExtractionResult {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    // Convert CSV to pipe-delimited text for downstream parsing
    const text = lines
      .map(line => {
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
        return cols.join(' | ');
      })
      .join('\n');
    return { success: true, text: cleanExtractedText(text), file_type: 'csv', char_count: text.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, text: '', file_type: 'csv', char_count: 0, error: `CSV parse failed: ${msg}` };
  }
}

// ── Plain text extraction ──────────────────────────────────────

function extractText(filePath: string): FileExtractionResult {
  try {
    const text = fs.readFileSync(filePath, 'utf-8');
    return { success: true, text: cleanExtractedText(text), file_type: 'text', char_count: text.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, text: '', file_type: 'text', char_count: 0, error: `Text read failed: ${msg}` };
  }
}

// ── Dispatcher ─────────────────────────────────────────────────

export async function extractFileText(filePath: string): Promise<FileExtractionResult> {
  const fileType = detectFileType(filePath);
  if (!fileType) {
    return {
      success: false,
      text: '',
      file_type: 'text',
      char_count: 0,
      error: `Unsupported file type: ${path.extname(filePath)}`,
    };
  }

  switch (fileType) {
    case 'pdf':   return extractPdf(filePath);
    case 'excel': return extractExcel(filePath);
    case 'word':  return extractWord(filePath);
    case 'csv':   return extractCsv(filePath);
    case 'text':  return extractText(filePath);
  }
}

// ── Text cleaning ──────────────────────────────────────────────

function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')          // normalize line endings
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')             // tabs → spaces
    .replace(/[ \t]{3,}/g, '  ')     // collapse runs of spaces (preserve some indent)
    .replace(/\n{4,}/g, '\n\n\n')    // max 3 consecutive newlines
    .trim()
    .slice(0, 50_000);               // hard cap to prevent memory issues
}

// ── SHA-256 hash of file ───────────────────────────────────────

export function hashFile(filePath: string): string {
  const crypto = require('crypto') as typeof import('crypto');
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
