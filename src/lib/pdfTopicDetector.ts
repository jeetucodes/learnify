export interface DetectedPdfTopic {
  id: string;
  title: string;
  description: string;
}

export interface PdfTopicAnalysis {
  mainTopic: string;
  detectedTopics: DetectedPdfTopic[];
}

/**
 * Cleans a filename or list of filenames into a human-readable title.
 * e.g., "OS_Lecture_3_Deadlocks.pdf" -> "OS Lecture 3 Deadlocks"
 */
export function cleanFileNameToTitle(fileNameOrNames: string | string[]): string {
  if (Array.isArray(fileNameOrNames)) {
    if (fileNameOrNames.length === 0) return 'Study Notes';
    if (fileNameOrNames.length === 1) return cleanFileNameToTitle(fileNameOrNames[0]);
    const firstTwo = fileNameOrNames.slice(0, 2).map((f) => cleanFileNameToTitle(f));
    if (fileNameOrNames.length > 2) {
      return `${firstTwo.join(', ')} +${fileNameOrNames.length - 2} more`;
    }
    return firstTwo.join(' & ');
  }

  const withoutExt = fileNameOrNames.replace(/\.[^/.]+$/, '');
  const clean = withoutExt
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize words
  return clean
    .split(' ')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Heuristically extracts topics from raw text if AI is unreachable.
 */
function extractTopicsHeuristically(text: string, fileNameOrNames: string | string[]): PdfTopicAnalysis {
  const mainTopic = cleanFileNameToTitle(fileNameOrNames);
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 4 && l.length < 80);

  const candidateTitles: string[] = [];

  for (const line of lines) {
    // Check for common heading patterns:
    // Chapter X, Unit X, Section X, 1.1 Topic, all-caps, or ends with colon
    if (
      /^(chapter|unit|module|section|part|lecture)\s+\d+/i.test(line) ||
      /^\d+(\.\d+)*\s+[A-Z]/.test(line) ||
      (line.endsWith(':') && line.length < 50) ||
      (line === line.toUpperCase() && line.split(' ').length <= 6 && /[A-Z]/.test(line))
    ) {
      const cleanLine = line.replace(/[:#*_\-]/g, '').trim();
      if (cleanLine.length > 4 && !candidateTitles.includes(cleanLine)) {
        candidateTitles.push(cleanLine);
      }
    }
  }

  // If not enough headings found, find recurring capitalized phrases / themes
  if (candidateTitles.length < 3) {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 30);
    for (const p of paragraphs.slice(0, 10)) {
      const firstLine = p.split('\n')[0].replace(/[:#*_\-]/g, '').trim();
      if (firstLine.length > 5 && firstLine.length < 60 && !candidateTitles.includes(firstLine)) {
        candidateTitles.push(firstLine);
      }
      if (candidateTitles.length >= 5) break;
    }
  }

  const detectedTopics: DetectedPdfTopic[] = candidateTitles.slice(0, 5).map((title, idx) => ({
    id: `topic_${idx + 1}`,
    title,
    description: `Core concept extracted from document pages`,
  }));

  return {
    mainTopic: mainTopic || 'Study Notes',
    detectedTopics,
  };
}

/**
 * Analyzes text extracted from a PDF to detect the main document topic
 * and individual subtopics directly from the PDF content using Gemini 3.5 Flash,
 * with a resilient heuristic fallback.
 */
export async function detectTopicsFromPdfText(
  text: string,
  fileNameOrNames: string | string[]
): Promise<PdfTopicAnalysis> {
  const fallback = extractTopicsHeuristically(text, fileNameOrNames);
  const displayNames = Array.isArray(fileNameOrNames) ? fileNameOrNames.join(', ') : fileNameOrNames;

  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key' || !text || text.trim().length < 50) {
    return fallback;
  }

  const model = (import.meta as any).env?.VITE_GEMINI_MODEL || 'gemini-3.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Use the first 4,500 characters of the PDF for fast, high-quality topic extraction
  const snippet = text.slice(0, 4500);

  const prompt = `You are an academic curriculum parser and professor. Analyze the following document text from study material (${displayNames}).
Identify:
1. "mainTopic": The high-level subject or chapter title of this document (e.g., "Operating Systems: Process Synchronization & Deadlocks", "Organic Chemistry: Carbonyl Compounds", "Computer Networks: Transport Layer Protocols").
2. "subtopics": An array of 3 to 6 distinct specific subtopics / modules covered inside this text.

Document snippet:
${snippet}

Respond strictly with valid JSON matching this schema:
{
  "mainTopic": "string",
  "subtopics": [
    {
      "title": "string",
      "description": "1 short sentence explaining what this subtopic covers"
    }
  ]
}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!res.ok) {
      console.warn('Gemini topic extraction status:', res.status);
      return fallback;
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return fallback;

    const cleaned = rawText
      .replace(/^```json/im, '')
      .replace(/^```/im, '')
      .replace(/```$/im, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    if (parsed && typeof parsed.mainTopic === 'string' && Array.isArray(parsed.subtopics)) {
      const detectedTopics: DetectedPdfTopic[] = parsed.subtopics
        .filter((st: any) => st && typeof st.title === 'string' && st.title.trim().length > 0)
        .map((st: any, idx: number) => ({
          id: `topic_${idx + 1}`,
          title: st.title.trim(),
          description: typeof st.description === 'string' ? st.description.trim() : 'Concepts from notes',
        }));

      return {
        mainTopic: parsed.mainTopic.trim() || fallback.mainTopic,
        detectedTopics: detectedTopics.length > 0 ? detectedTopics : fallback.detectedTopics,
      };
    }
  } catch (err) {
    console.warn('Gemini topic detection failed, using heuristic extraction:', err);
  }

  return fallback;
}

