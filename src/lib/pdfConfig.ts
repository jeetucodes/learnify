/**
 * Configurable PDF upload and processing limits.
 * Default max file size is 100 MB per PDF.
 * Configurable via VITE_MAX_PDF_SIZE_MB environment variable.
 */

const getEnvNumber = (key: string, defaultValue: number): number => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      const parsed = Number(import.meta.env[key]);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return defaultValue;
};

// Maximum file size in Megabytes (Default: 100 MB)
export const MAX_PDF_SIZE_MB: number = getEnvNumber('VITE_MAX_PDF_SIZE_MB', 100);

// Maximum file size in Bytes
export const MAX_PDF_SIZE_BYTES: number = MAX_PDF_SIZE_MB * 1024 * 1024;

// Maximum number of PDF files in a multi-file batch upload (Default: 10)
export const MAX_BATCH_PDF_COUNT: number = getEnvNumber('VITE_MAX_BATCH_PDF_COUNT', 10);

// Maximum pages to process in a single session (Default: 200 pages)
export const MAX_PDF_PAGES: number = getEnvNumber('VITE_MAX_PDF_PAGES', 200);

/**
 * Formats byte size into human-readable text (KB, MB, GB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Validates a candidate PDF file against size and format requirements.
 */
export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  // Validate extension and MIME type
  const isPdf =
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf');

  if (!isPdf) {
    return {
      valid: false,
      error: `"${file.name}" is not a PDF. Only PDF documents are supported.`,
    };
  }

  // Validate size against configurable limit (default 100 MB)
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return {
      valid: false,
      error: `"${file.name}" (${formatFileSize(file.size)}) exceeds the maximum limit of ${MAX_PDF_SIZE_MB} MB. Please upload a PDF under ${MAX_PDF_SIZE_MB} MB.`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: `"${file.name}" is an empty file (0 bytes).`,
    };
  }

  return { valid: true };
}
