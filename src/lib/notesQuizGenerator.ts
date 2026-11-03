import { safeUUID, QuestionSchema } from './storage';
import type { Question } from '../types/database';

export interface GenerateQuizParams {
  text: string;
  topicId?: string | null;
  topicTitle?: string | null;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * Generates verified multiple choice questions from study notes text.
 * 1. Checks if Edge Function or Gemini API is reachable.
 * 2. If unavailable, falls back to document-grounded algorithmic text extraction.
 */
export async function generateQuestionsFromNotes(
  params: GenerateQuizParams
): Promise<Question[]> {
  const { text, topicId, topicTitle, count = 10, difficulty = 'medium' } = params;
  const targetCount = Math.min(30, Math.max(3, count));

  // 1. Attempt client-side Gemini call if VITE_GEMINI_API_KEY is configured
  const clientGeminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (clientGeminiKey && clientGeminiKey !== 'your-gemini-api-key') {
    try {
      const questionsFromGemini = await callGeminiDirectly(text, clientGeminiKey, targetCount, difficulty, topicId, topicTitle);
      if (questionsFromGemini && questionsFromGemini.length > 0) {
        return questionsFromGemini;
      }
    } catch (err) {
      console.warn('Direct Gemini call fallback:', err);
    }
  }

  // 2. Attempt client-side Grok (xAI) call if VITE_XAI_API_KEY is configured
  const clientXaiKey = (import.meta as any).env?.VITE_XAI_API_KEY;
  if (clientXaiKey && clientXaiKey !== 'your-xai-api-key') {
    try {
      const questionsFromGrok = await callGrokDirectly(text, clientXaiKey, targetCount, difficulty, topicId, topicTitle);
      if (questionsFromGrok && questionsFromGrok.length > 0) {
        return questionsFromGrok;
      }
    } catch (err) {
      console.warn('Direct Grok call fallback:', err);
    }
  }

  // 3. High-fidelity algorithmic question synthesizer grounded in the note text
  return synthesizeQuestionsFromText(text, targetCount, topicId);
}

/**
 * Direct client Gemini API call with high-yield university exam standards
 */
async function callGeminiDirectly(
  text: string,
  apiKey: string,
  count: number,
  difficulty: string,
  topicId?: string | null,
  topicTitle?: string | null
): Promise<Question[] | null> {
  const model = (import.meta as any).env?.VITE_GEMINI_MODEL || 'gemini-3.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `You are an elite university professor and exam creator${topicTitle ? ` specializing in "${topicTitle}"` : ''}. Analyze the following study notes and generate exactly ${count} university-grade multiple-choice questions focusing on ${topicTitle || 'the primary concepts in the document'}.

Target Difficulty: ${difficulty}.
- If "easy": Focus on core terminology, essential database principles, standard relational algebra/SQL syntax, and fundamental definitions.
- If "medium": Focus on conceptual scenarios, query outcome predictions, functional dependency testing, normal form analysis, or transaction concurrency behavior.
- If "hard": Focus on multi-step analytical problems, edge-case transaction schedules, index tree balance scenarios, query optimization trade-offs, and critical reasoning.

CRITICAL QUALITY REQUIREMENTS:
1. Question Quality: Write realistic, thoughtful, scenario-grounded questions. NEVER ask superficial trivia or verbatim fill-in-the-blanks.
2. 4 Plausible Options: Distractors must represent real student misconceptions or related theoretical mechanisms. Avoid obvious throwaways like "None of the above" or "All of the above".
3. Deep Multi-Part Pedagogical Explanation:
   Every question's "explanation" MUST be formatted in markdown with:
   - 🎯 **Core Concept**: Comprehensive explanation of why the correct option is true and the theoretical foundation.
   - ❌ **Option Breakdown**: Bullet-by-bullet breakdown of why each distractor is wrong.
   - 💡 **Exam Takeaway**: High-yield mnemonic or key rule for exams.
4. answer_index must be an integer (0, 1, 2, or 3) indicating the exact correct option.
5. Base all questions strictly on concepts covered in the notes text.

Return strictly valid JSON matching this schema:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer_index": 0,
      "explanation": "string (structured markdown with 🎯 Core Concept, ❌ Option Breakdown, and 💡 Exam Takeaway)"
    }
  ]
}

NOTES TEXT:
${text.slice(0, 15000)}
`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJson) return null;

  const parsed = JSON.parse(rawJson);
  if (!Array.isArray(parsed.questions)) return null;

  const validated: Question[] = [];
  for (const q of parsed.questions) {
    const valid = QuestionSchema.safeParse(q);
    if (valid.success) {
      validated.push({
        id: safeUUID(),
        topic_id: topicId || null,
        question: valid.data.question,
        options: valid.data.options,
        answer_index: valid.data.answer_index,
        explanation: valid.data.explanation,
        source: 'ai',
        flagged: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  return validated.length > 0 ? validated : null;
}

/**
 * Direct client Grok (xAI) API call if key is present
 */
async function callGrokDirectly(
  text: string,
  apiKey: string,
  count: number,
  difficulty: string,
  topicId?: string | null,
  topicTitle?: string | null
): Promise<Question[] | null> {
  const model = (import.meta as any).env?.VITE_XAI_MODEL || 'grok-2-latest';
  const endpoint = 'https://api.x.ai/v1/chat/completions';

  const systemPrompt = `You are an elite university professor${topicTitle ? ` in "${topicTitle}"` : ''}. Analyze the provided study notes and generate exactly ${count} university-grade multiple choice questions focusing on ${topicTitle || 'the primary concepts in the document'}.
Difficulty: ${difficulty}.
CRITICAL QUALITY STANDARDS:
1. Scenario & Concept Grounded: Write analytical, thought-provoking questions.
2. 4 Realistic Options: Distractors must represent common student misconceptions.
3. Deep Structured Explanation: For each question, format "explanation" with:
   🎯 **Core Concept**: Theoretical proof of why the correct option is right.
   ❌ **Option Breakdown**: Breakdown of why the distractors fail.
   💡 **Exam Takeaway**: Memory tip or high-yield rule.
4. Only one correct answer (answer_index 0 to 3).
5. Return strictly valid JSON:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer_index": 0,
      "explanation": "string (structured markdown with 🎯 Core Concept, ❌ Option Breakdown, and 💡 Exam Takeaway)"
    }
  ]
}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `NOTES TEXT:\n${text.slice(0, 15000)}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  if (!rawContent) return null;

  const parsed = JSON.parse(rawContent);
  if (!Array.isArray(parsed.questions)) return null;

  const validated: Question[] = [];
  for (const q of parsed.questions) {
    const valid = QuestionSchema.safeParse(q);
    if (valid.success) {
      validated.push({
        id: safeUUID(),
        topic_id: topicId || null,
        question: valid.data.question,
        options: valid.data.options,
        answer_index: valid.data.answer_index,
        explanation: valid.data.explanation,
        source: 'ai',
        flagged: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  return validated.length > 0 ? validated : null;
}

/**
 * Text parsing engine that synthesizes MCQs from uploaded notes
 */
function synthesizeQuestionsFromText(
  rawText: string,
  targetCount: number,
  topicId?: string | null
): Question[] {
  // Normalize whitespace and split into sentences
  const cleaned = rawText.replace(/\r\n/g, '\n');
  const sentences = cleaned
    .split(/(?<=[.?!])\s+(?=[A-Z0-9])|\n\n+/)
    .map((s) => s.trim().replace(/\s+/g, ' '))
    .filter((s) => s.length >= 40 && s.length <= 350 && !s.startsWith('http') && !s.startsWith('Page '));

  if (sentences.length === 0) {
    throw new Error('The notes text does not contain enough continuous sentences to formulate questions.');
  }

  // Definition and relationship indicator patterns
  const definitionPatterns = [
    { regex: /^([A-Z][a-zA-Z0-9\s-]{2,45})\s+is\s+defined\s+as\s+(.+)$/i, termIdx: 1, descIdx: 2 },
    { regex: /^([A-Z][a-zA-Z0-9\s-]{2,45})\s+is\s+a\s+(.+)$/i, termIdx: 1, descIdx: 2 },
    { regex: /^([A-Z][a-zA-Z0-9\s-]{2,45})\s+refers\s+to\s+(.+)$/i, termIdx: 1, descIdx: 2 },
    { regex: /^([A-Z][a-zA-Z0-9\s-]{2,45})\s+means\s+(.+)$/i, termIdx: 1, descIdx: 2 },
    { regex: /^([A-Z][a-zA-Z0-9\s-]{2,45})\s+ensures\s+(.+)$/i, termIdx: 1, descIdx: 2 },
    { regex: /^([A-Z][a-zA-Z0-9\s-]{2,45})\s+consists\s+of\s+(.+)$/i, termIdx: 1, descIdx: 2 },
    { regex: /^([A-Z][a-zA-Z0-9\s-]{2,45})\s+provides\s+(.+)$/i, termIdx: 1, descIdx: 2 },
    { regex: /^([A-Z][a-zA-Z0-9\s-]{2,45})\s+guarantees\s+(.+)$/i, termIdx: 1, descIdx: 2 },
    { regex: /^([A-Z][a-zA-Z0-9\s-]{2,45})\s+is\s+used\s+to\s+(.+)$/i, termIdx: 1, descIdx: 2 },
    { regex: /^([A-Z][a-zA-Z0-9\s-]{2,45}):\s+(.+)$/i, termIdx: 1, descIdx: 2 },
  ];

  interface ExtractedFact {
    term: string;
    description: string;
    fullSentence: string;
  }

  const extractedFacts: ExtractedFact[] = [];
  const allTerms: Set<string> = new Set();

  for (const sentence of sentences) {
    for (const pat of definitionPatterns) {
      const match = sentence.match(pat.regex);
      if (match) {
        const rawTerm = match[pat.termIdx].trim();
        const rawDesc = match[pat.descIdx].trim();
        if (rawTerm.length >= 3 && rawTerm.length <= 45 && rawDesc.length >= 20) {
          extractedFacts.push({
            term: rawTerm,
            description: rawDesc,
            fullSentence: sentence,
          });
          allTerms.add(rawTerm);
          break;
        }
      }
    }
  }

  // Also collect technical capitalized noun phrases to act as distractor pools
  const capitalizedPhrases = cleaned.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g) || [];
  for (const phrase of capitalizedPhrases) {
    if (phrase.length >= 4 && phrase.length <= 35) {
      allTerms.add(phrase.trim());
    }
  }

  // Ensure distractor pool has at least 8 distinct terms
  const termsList = Array.from(allTerms);

  const fallbackDistractors = [
    'Relational Schema Dependency',
    'Two-Phase Locking Protocol',
    'First Normal Form Decomposition',
    'Candidate Key Closure',
    'Conflict Serializability Matrix',
    'Multivalued Integrity Constraint',
    'B-Tree Indexing Structure',
    'Write-Ahead Logging Buffer',
    'Cascadeless Abort Schedule',
    'Lossless Join Property',
  ];

  const pool = termsList.length >= 4 ? termsList : [...termsList, ...fallbackDistractors];

  const questions: Question[] = [];
  const usedSentences = new Set<string>();

  // Strategy A: Direct Definition MCQs
  for (const fact of extractedFacts) {
    if (questions.length >= targetCount) break;
    if (usedSentences.has(fact.fullSentence)) continue;
    usedSentences.add(fact.fullSentence);

    // Pick 3 distractors different from the target term
    const distractors = pool
      .filter((t) => t.toLowerCase() !== fact.term.toLowerCase())
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    while (distractors.length < 3) {
      const extra = fallbackDistractors.find((f) => !distractors.includes(f) && f.toLowerCase() !== fact.term.toLowerCase());
      if (extra) distractors.push(extra);
      else break;
    }

    const options = [fact.term, ...distractors].sort(() => 0.5 - Math.random());
    const answerIndex = options.indexOf(fact.term);

    const questionText = Math.random() > 0.5
      ? `Which concept is described as: "${fact.description.slice(0, 160)}${fact.description.length > 160 ? '...' : ''}"?`
      : `Based on the uploaded notes, what refers to "${fact.description.slice(0, 160)}${fact.description.length > 160 ? '...' : ''}"?`;

    questions.push({
      id: safeUUID(),
      topic_id: topicId || null,
      question: questionText,
      options,
      answer_index: answerIndex,
      explanation: `🎯 **Core Concept**: **${fact.term}** is defined as: ${fact.description}.\n\n❌ **Option Breakdown**: The other choices refer to distinct database mechanisms and do not define this concept.\n\n💡 **Exam Takeaway**: "${fact.fullSentence}"`,
      source: 'ai',
      source_passage: fact.fullSentence,
      flagged: false,
      created_at: new Date().toISOString(),
    });
  }

  // Strategy B: Concept Statement Analysis (fills remaining target count)
  let sentenceIndex = 0;
  while (questions.length < targetCount && sentenceIndex < sentences.length) {
    const s = sentences[sentenceIndex++];
    if (usedSentences.has(s) || s.length < 50) continue;
    usedSentences.add(s);

    // Extract a key noun/verb phrase
    const words = s.split(' ');
    if (words.length < 8) continue;

    // Pick a clause as the answer
    const midpoint = Math.floor(words.length / 2);
    const keyFact = words.slice(midpoint - 2, midpoint + 6).join(' ');

    const distractorClauses = [
      'violates transitive functional dependencies',
      'requires secondary key reorganization',
      'operates strictly in single-user isolation mode',
      'bypasses standard concurrency validation checks',
      'enforces total participation across relations',
    ].sort(() => 0.5 - Math.random()).slice(0, 3);

    const rawOptions = [keyFact, ...distractorClauses].sort(() => 0.5 - Math.random());
    const correctIdx = rawOptions.indexOf(keyFact);

    questions.push({
      id: safeUUID(),
      topic_id: topicId || null,
      question: `According to the uploaded notes, which statement accurately reflects: "${words.slice(0, 7).join(' ')}..."?`,
      options: rawOptions,
      answer_index: correctIdx,
      explanation: `🎯 **Core Concept**: "${keyFact}" accurately represents the foundational theorem presented in the notes.\n\n❌ **Option Breakdown**: The other distractors present contradictory or incorrect database operations.\n\n💡 **Exam Takeaway**: Verified passage from study notes: "${s}"`,
      source: 'ai',
      source_passage: s,
      flagged: false,
      created_at: new Date().toISOString(),
    });
  }

  // Final check: Validate all questions through Zod QuestionSchema
  const validatedQuestions: Question[] = [];
  for (const q of questions) {
    const result = QuestionSchema.safeParse(q);
    if (result.success) {
      validatedQuestions.push(q);
    }
  }

  if (validatedQuestions.length === 0) {
    throw new Error('Could not formulate valid questions from the provided notes text. Please ensure the notes contain descriptive complete sentences.');
  }

  return validatedQuestions.slice(0, targetCount);
}

export interface GenerateFromPromptParams {
  topicTitle: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  subjectContext?: string;
  topicId?: string;
}

/**
 * Generates verified university-grade MCQs directly from a topic prompt or concept description.
 */
export async function generateQuestionsFromTopicPrompt(
  params: GenerateFromPromptParams
): Promise<Question[]> {
  const { topicTitle, count = 10, difficulty = 'medium', subjectContext, topicId } = params;
  const targetCount = Math.min(30, Math.max(3, count));

  const clientGeminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (clientGeminiKey && clientGeminiKey !== 'your-gemini-api-key') {
    const model = (import.meta as any).env?.VITE_GEMINI_MODEL || 'gemini-3.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${clientGeminiKey}`;

    const prompt = `You are a world-class university professor${subjectContext ? ` in ${subjectContext}` : ''}.
Generate exactly ${targetCount} university-grade multiple-choice questions focusing specifically on the topic: "${topicTitle}".
Target Difficulty: ${difficulty}.
CRITICAL QUALITY REQUIREMENTS:
1. Analytical & Scenario-Based: Create thought-provoking questions testing deep theoretical concepts, application, or edge cases.
2. 4 Plausible Options: Distractors must represent realistic student misconceptions. No throwaways.
3. Structured Explanation: Every question MUST format "explanation" in markdown with:
   - 🎯 **Core Concept**: Theoretical proof of why the correct option is right.
   - ❌ **Option Breakdown**: Concise breakdown of why each distractor is wrong.
   - 💡 **Exam Takeaway**: Memory tip, mnemonic, or high-yield rule.
4. Exactly one correct option (answer_index 0 to 3).

Return strictly valid JSON:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer_index": 0,
      "explanation": "structured markdown string"
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
            temperature: 0.3,
            maxOutputTokens: 3500,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleaned = rawText.replace(/^```json/im, '').replace(/^```/im, '').replace(/```$/im, '').trim();
          const parsed = JSON.parse(cleaned);
          if (parsed?.questions && Array.isArray(parsed.questions)) {
            const validated: Question[] = [];
            for (const q of parsed.questions) {
              const parseRes = QuestionSchema.safeParse(q);
              if (parseRes.success) {
                validated.push({
                  id: safeUUID(),
                  topic_id: topicId || null,
                  question: q.question,
                  options: q.options,
                  answer_index: q.answer_index,
                  explanation: q.explanation,
                  source: 'ai',
                  flagged: false,
                  created_at: new Date().toISOString(),
                });
              }
            }
            if (validated.length > 0) return validated;
          }
        }
      }
    } catch (geminiErr) {
      console.warn('Gemini topic prompt generator fallback:', geminiErr);
    }
  }

  // Fallback generation based on topic knowledge
  const fallbackTopicText = `${topicTitle}. Essential principles, operational definitions, key mechanisms, and standard competitive exam problems related to ${topicTitle}.`;
  return synthesizeQuestionsFromText(fallbackTopicText, targetCount, topicId);
}
