import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { MAX_PDF_PAGES } from './pdfConfig';

// Vite-friendly worker URL with reliable fallback
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
}

export interface ProgressInfo {
  currentPage: number;
  totalPages: number;
  percent: number;
  stage: 'streaming' | 'extracting' | 'ocr' | 'chunking' | 'complete';
  message: string;
  currentFileName?: string;
}

export interface SingleFileExtractionResult {
  fileName: string;
  fileSize: number;
  text: string;
  totalPages: number;
  processedPages: number;
  isScanned: boolean;
  ocrApplied: boolean;
  chunks: string[];
}

export interface MultiPdfExtractionResult {
  text: string;
  totalFiles: number;
  totalPages: number;
  totalSize: number;
  files: SingleFileExtractionResult[];
  chunks: string[];
  isScanned: boolean;
  ocrApplied: boolean;
}

// In-memory worker singleton for Tesseract OCR fallback
let sharedTesseractWorker: any = null;
let tesseractInitializing = false;

async function getTesseractWorker() {
  if (sharedTesseractWorker) return sharedTesseractWorker;
  if (tesseractInitializing) {
    while (tesseractInitializing && !sharedTesseractWorker) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return sharedTesseractWorker;
  }

  tesseractInitializing = true;
  try {
    const worker = await createWorker('eng');
    sharedTesseractWorker = worker;
    return worker;
  } catch (err) {
    console.warn('Tesseract worker initialization notice:', err);
    return null;
  } finally {
    tesseractInitializing = false;
  }
}

/**
 * OCR scanned or image-based PDF page.
 * Priority 1: Gemini 3.5 Flash Multimodal Vision (fast, handles handwriting & formulas).
 * Priority 2: Tesseract.js client-side OCR (offline fallback).
 */
async function ocrCanvasPage(canvas: HTMLCanvasElement): Promise<string> {
  // 1. Try Gemini Vision if API key is configured
  try {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your-gemini-api-key') {
      const model = (import.meta as any).env?.VITE_GEMINI_MODEL || 'gemini-3.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64Data = dataUrl.split(',')[1];

      if (base64Data) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: 'Transcribe all text, handwritten notes, mathematical equations, diagrams, and tables from this scanned lecture page into clear, clean markdown text. Do not add conversational remarks.',
                  },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1200,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim().length > 10) {
            return text.trim();
          }
        }
      }
    }
  } catch (geminiErr) {
    console.warn('Gemini multimodal OCR fallback:', geminiErr);
  }

  // 2. Offline / local Tesseract.js fallback
  try {
    const worker = await getTesseractWorker();
    if (worker) {
      const ret = await worker.recognize(canvas);
      if (ret?.data?.text && ret.data.text.trim().length > 10) {
        return ret.data.text.trim();
      }
    }
  } catch (tesseractErr) {
    console.warn('Tesseract OCR error:', tesseractErr);
  }

  return '';
}

/**
 * Extracts text from a single PDF using memory-efficient streaming via URL.createObjectURL.
 * Never loads large 100 MB ArrayBuffers directly into browser memory.
 * Performs OCR on scanned / image-based pages.
 */
export async function extractTextFromPdf(
  file: File,
  onProgress?: (progress: ProgressInfo) => void
): Promise<SingleFileExtractionResult> {
  // Use Blob URL streaming so pdfjs range-requests bytes on demand
  const objectUrl = URL.createObjectURL(file);

  try {
    if (onProgress) {
      onProgress({
        currentPage: 0,
        totalPages: 0,
        percent: 0,
        stage: 'streaming',
        message: `Streaming "${file.name}"...`,
        currentFileName: file.name,
      });
    }

    const loadingTask = pdfjsLib.getDocument({
      url: objectUrl,
      disableRange: false,
      disableStream: false,
      disableAutoFetch: false,
    });

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pagesToRead = Math.min(totalPages, MAX_PDF_PAGES);

    let fullText = '';
    let scannedPagesCount = 0;
    let ocrApplied = false;

    for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
      const percent = Math.round((pageNum / pagesToRead) * 100);

      if (onProgress) {
        onProgress({
          currentPage: pageNum,
          totalPages: pagesToRead,
          percent,
          stage: 'extracting',
          message: `Reading page ${pageNum} of ${pagesToRead} (${percent}%)...`,
          currentFileName: file.name,
        });
      }

      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings: string[] = [];

      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string') {
          const cleanedStr = item.str.replace(/\s+/g, ' ').trim();
          if (cleanedStr) {
            pageStrings.push(cleanedStr);
          }
        }
      }

      const pageText = pageStrings.join(' ').trim();

      // Check if page has extractable text (>= 25 characters)
      if (pageText.length >= 25) {
        fullText += `\n\n--- [Page ${pageNum}] ---\n` + pageText;
      } else {
        // Page has little or no text: likely scanned / handwritten / diagram
        scannedPagesCount++;

        if (onProgress) {
          onProgress({
            currentPage: pageNum,
            totalPages: pagesToRead,
            percent,
            stage: 'ocr',
            message: `Applying AI OCR to scanned page ${pageNum} of ${pagesToRead}...`,
            currentFileName: file.name,
          });
        }

        try {
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            await (page.render({ canvas, canvasContext: ctx, viewport } as any)).promise;
            const ocrResult = await ocrCanvasPage(canvas);
            if (ocrResult) {
              fullText += `\n\n--- [Page ${pageNum} (OCR Scanned)] ---\n` + ocrResult;
              ocrApplied = true;
            }
          }
        } catch (ocrErr) {
          console.warn(`OCR error on page ${pageNum}:`, ocrErr);
        }
      }

      // Yield control cooperatively to keep 60 FPS UI on massive files
      if (pageNum % 3 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    const trimmedText = fullText.trim();
    const isScanned = scannedPagesCount > pagesToRead * 0.5;

    // Split text into semantic chunks for AI processing
    const chunks = chunkTextOnParagraphs(trimmedText, 4000);

    if (onProgress) {
      onProgress({
        currentPage: pagesToRead,
        totalPages: pagesToRead,
        percent: 100,
        stage: 'complete',
        message: `Extraction complete: ${pagesToRead} pages processed.`,
        currentFileName: file.name,
      });
    }

    return {
      fileName: file.name,
      fileSize: file.size,
      text: trimmedText,
      totalPages,
      processedPages: pagesToRead,
      isScanned,
      ocrApplied,
      chunks,
    };
  } catch (err: any) {
    // Provide explicit, user-friendly diagnostics
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('password') || err?.name === 'PasswordException') {
      throw new Error(`"${file.name}" is password-protected. Please remove the password and re-upload.`);
    }
    if (msg.includes('invalid') || msg.includes('corrupted') || err?.name === 'InvalidPDFException') {
      throw new Error(`"${file.name}" is corrupted or has an invalid PDF structure.`);
    }
    throw new Error(`Failed to extract text from "${file.name}": ${err?.message || 'Unknown error'}`);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Extracts text from multiple PDFs in batch with unified progress tracking.
 * Combines documents while preserving document names and page numbers.
 */
export async function extractTextFromMultiplePdfs(
  files: File[],
  onProgress?: (progress: ProgressInfo) => void
): Promise<MultiPdfExtractionResult> {
  if (files.length === 0) {
    return {
      text: '',
      totalFiles: 0,
      totalPages: 0,
      totalSize: 0,
      files: [],
      chunks: [],
      isScanned: false,
      ocrApplied: false,
    };
  }

  const results: SingleFileExtractionResult[] = [];
  let combinedText = '';
  let totalPagesCount = 0;
  let totalSizeCount = 0;
  let hasScanned = false;
  let hasOcr = false;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    totalSizeCount += file.size;

    const fileResult = await extractTextFromPdf(file, (p) => {
      if (onProgress) {
        const overallPercent = Math.round(
          ((i + p.percent / 100) / files.length) * 100
        );
        onProgress({
          ...p,
          percent: overallPercent,
          message: `[File ${i + 1}/${files.length}: ${file.name}] ${p.message}`,
          currentFileName: file.name,
        });
      }
    });

    results.push(fileResult);
    totalPagesCount += fileResult.processedPages;
    if (fileResult.isScanned) hasScanned = true;
    if (fileResult.ocrApplied) hasOcr = true;

    // Combine with clear document boundaries
    combinedText += `\n\n====================================================\n`;
    combinedText += `DOCUMENT ${i + 1}: ${file.name} (${fileResult.processedPages} pages)\n`;
    combinedText += `====================================================\n\n`;
    combinedText += fileResult.text;
  }

  const trimmed = combinedText.trim();
  const chunks = chunkTextOnParagraphs(trimmed, 4000);

  if (onProgress) {
    onProgress({
      currentPage: totalPagesCount,
      totalPages: totalPagesCount,
      percent: 100,
      stage: 'complete',
      message: `Successfully processed ${files.length} PDF documents (${totalPagesCount} total pages).`,
    });
  }

  return {
    text: trimmed,
    totalFiles: files.length,
    totalPages: totalPagesCount,
    totalSize: totalSizeCount,
    files: results,
    chunks,
    isScanned: hasScanned,
    ocrApplied: hasOcr,
  };
}

/**
 * Split text into chunks of about 3,000-4,000 characters on paragraph boundaries
 */
export function chunkTextOnParagraphs(text: string, targetChunkSize = 4000): string[] {
  if (!text || text.length <= targetChunkSize) {
    return [text];
  }

  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (currentChunk.length + trimmedPara.length + 2 <= targetChunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      // If a single paragraph is longer than targetChunkSize, chunk by sentence
      if (trimmedPara.length > targetChunkSize) {
        const sentences = trimmedPara.split(/(?<=[.!?])\s+/);
        let sentenceChunk = '';
        for (const s of sentences) {
          if (sentenceChunk.length + s.length + 1 <= targetChunkSize) {
            sentenceChunk = sentenceChunk ? `${sentenceChunk} ${s}` : s;
          } else {
            if (sentenceChunk) chunks.push(sentenceChunk);
            sentenceChunk = s;
          }
        }
        currentChunk = sentenceChunk;
      } else {
        currentChunk = trimmedPara;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * SHA-256 hash helper for client-side caching of extracted notes text
 */
export async function computeContentHash(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
