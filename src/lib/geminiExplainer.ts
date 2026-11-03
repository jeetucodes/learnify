import type { Question } from '../types/database';

export interface ExplainParams {
  question: string;
  options: string[];
  selectedIndex?: number | null;
  correctIndex: number;
  currentExplanation?: string;
  topicTitle?: string;
}

// In-memory cache to prevent redundant API calls
const explanationCache = new Map<string, string>();

/**
 * Calls Gemini 3.5 Flash to generate a deep pedagogical explanation of a question and its options.
 */
export async function explainQuestionWithGemini(params: ExplainParams): Promise<string> {
  const { question, options, selectedIndex, correctIndex, currentExplanation, topicTitle } = params;

  const cacheKey = `${question}_${selectedIndex}_${correctIndex}`;
  if (explanationCache.has(cacheKey)) {
    return explanationCache.get(cacheKey)!;
  }

  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return currentExplanation || 'Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.';
  }

  const model = (import.meta as any).env?.VITE_GEMINI_MODEL || 'gemini-3.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const letters = ['A', 'B', 'C', 'D'];
  const formattedOptions = options
    .map((opt, i) => `${letters[i]}. ${opt}${i === correctIndex ? ' (CORRECT)' : ''}`)
    .join('\n');

  const userChoiceText =
    selectedIndex !== undefined && selectedIndex !== null && selectedIndex >= 0
      ? `Student selected: Option ${letters[selectedIndex]} - "${options[selectedIndex]}" (${
          selectedIndex === correctIndex ? 'CORRECT' : 'INCORRECT'
        })`
      : 'Student did not select an option yet.';

  const prompt = `You are a world-class university computer science professor and tutor. A student is practicing database and computer science questions${
    topicTitle ? ` on topic "${topicTitle}"` : ''
  }. Explain this question and its answer with deep pedagogical clarity.

QUESTION:
${question}

OPTIONS:
${formattedOptions}

STUDENT ACTION:
${userChoiceText}

${currentExplanation ? `INITIAL NOTES / SHORT RATIONALE:\n${currentExplanation}\n` : ''}

INSTRUCTIONS:
1. Explain in an encouraging, crystal-clear, structured manner.
2. Structure your response with the following markdown headings:
   - 🎯 **Core Concept & Why Option ${letters[correctIndex]} is Correct**: Clear theoretical proof and conceptual intuition.
   ${
     selectedIndex !== undefined && selectedIndex !== null && selectedIndex !== correctIndex
       ? `- ❌ **Why Option ${letters[selectedIndex]} was a Trap**: Explain the misconception that leads students to choose this option.`
       : ''
   }
   - 🔍 **Analysis of All Options**: 1-2 bullet points for each option (A, B, C, D) clarifying why each is right or wrong.
   - 💡 **Exam Memory Tip**: A catchy rule, mnemonic, or high-yield summary for university / competitive exams.

Write directly in clean, readable GitHub-flavored markdown.`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1200,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Gemini explain error status:', res.status, errText);
      return currentExplanation || 'Could not fetch deep AI explanation. Please check network connection.';
    }

    const data = await res.json();
    const explanation = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (explanation) {
      explanationCache.set(cacheKey, explanation);
      return explanation;
    }

    return currentExplanation || 'No detailed explanation generated.';
  } catch (err: any) {
    console.error('Gemini explanation error:', err);
    return currentExplanation || 'Failed to contact Gemini API. ' + (err?.message || '');
  }
}

/**
 * Answers a student's custom follow-up doubt or question about the active question
 */
export async function askGeminiDoubt(
  question: Question,
  userDoubt: string,
  chatHistory: Array<{ role: 'user' | 'model'; text: string }> = []
): Promise<string> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return 'Gemini API key is required to ask doubts. Please check your .env configuration.';
  }

  const model = (import.meta as any).env?.VITE_GEMINI_MODEL || 'gemini-3.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const letters = ['A', 'B', 'C', 'D'];
  const formattedOptions = question.options
    .map((opt, i) => `${letters[i]}. ${opt}${i === question.answer_index ? ' (CORRECT)' : ''}`)
    .join('\n');

  const systemContext = `You are a helpful and brilliant Computer Science Professor helping a university student who is studying this question:
Question: "${question.question}"
Options:
${formattedOptions}
Correct Answer: Option ${letters[question.answer_index]}
Explanation: ${question.explanation}

Answer the student's doubt directly, concisely, and clearly with examples.`;

  const contents: any[] = [{ role: 'user', parts: [{ text: systemContext }] }, { role: 'model', parts: [{ text: 'Understood. I am ready to answer any student doubt regarding this question.' }] }];

  for (const msg of chatHistory) {
    contents.push({ role: msg.role, parts: [{ text: msg.text }] });
  }

  contents.push({ role: 'user', parts: [{ text: userDoubt }] });

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!res.ok) {
      return 'Unable to resolve doubt right now. Please check connection.';
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  } catch (err: any) {
    return 'Doubt clarification failed: ' + (err?.message || 'Unknown error');
  }
}

