import * as pdfjsLib from 'pdfjs-dist';

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

export interface PdfExtractionResult {
  text: string;
  totalPages: number;
  isScanned: boolean;
  chunks: string[];
}

/**
 * Extract clean text page-by-page from an uploaded PDF File.
 * Notifies progress callback on each page.
 * Detects if the PDF is scanned (has no extractable text).
 */
export async function extractTextFromPdf(
  file: File,
  onProgress?: (currentPage: number, totalPages: number) => void
): Promise<PdfExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  let fullText = '';

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress(pageNum, totalPages);
    }

    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageStrings: string[] = [];

    for (const item of content.items) {
      if ('str' in item && typeof item.str === 'string') {
        const cleanedStr = item.str.replace(/\s+/g, ' ').trim();
        if (cleanedStr) {
          pageStrings.push(cleanedStr);
        }
      }
    }

    if (pageStrings.length > 0) {
      fullText += pageStrings.join(' ') + '\n\n';
    }
  }

  const trimmedText = fullText.trim();
  const nonWhitespaceChars = trimmedText.replace(/\s/g, '').length;

  // Check if PDF is scanned (under 30 non-whitespace characters across all pages)
  if (nonWhitespaceChars < 30) {
    return {
      text: '',
      totalPages,
      isScanned: true,
      chunks: [],
    };
  }

  // Split text into chunks of about 3,000-4,000 characters on paragraph boundaries
  const chunks = chunkTextOnParagraphs(trimmedText, 3500);

  return {
    text: trimmedText,
    totalPages,
    isScanned: false,
    chunks,
  };
}

/**
 * Split text into chunks of about 3,000-4,000 characters on paragraph boundaries
 */
export function chunkTextOnParagraphs(text: string, targetChunkSize = 3500): string[] {
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
