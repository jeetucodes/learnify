import { safeUUID, QuestionSchema } from './storage';
import type { Question } from '../types/database';

export interface ParsedQuestionDraft {
  question: string;
  options: [string, string, string, string];
  answer_index: number;
  explanation: string;
}

export interface BulkParseResult {
  questions: Question[];
  errors: string[];
}

/**
 * Parses raw text containing questions into structured Question objects.
 * Supports various formats:
 * - 1. Question / Q1: Question
 * - A) / B) / C) / D) or A. / B. / C. / D.
 * - Answer: A / Ans: B / Correct: C
 * - Explanation: ...
 */
export function parseBulkQuestionsText(
  rawText: string,
  topicId?: string
): BulkParseResult {
  const lines = rawText.split('\n').map((l) => l.trim());
  const drafts: ParsedQuestionDraft[] = [];
  const errors: string[] = [];

  let currentQuestion: string = '';
  let currentOptions: string[] = [];
  let currentAnswerIndex = 0;
  let currentExplanation = '';

  const finalizeCurrent = (qNumber: number) => {
    if (!currentQuestion) return;

    if (currentOptions.length < 4) {
      errors.push(
        `Question ${qNumber} ("${currentQuestion.slice(0, 30)}..."): Only ${currentOptions.length} option(s) found (requires 4).`
      );
      return;
    }

    const finalOptions: [string, string, string, string] = [
      currentOptions[0] || 'Option A',
      currentOptions[1] || 'Option B',
      currentOptions[2] || 'Option C',
      currentOptions[3] || 'Option D',
    ];

    drafts.push({
      question: currentQuestion,
      options: finalOptions,
      answer_index: currentAnswerIndex,
      explanation: currentExplanation.trim() || `Option ${['A', 'B', 'C', 'D'][currentAnswerIndex]} is the correct answer based on question parameters.`,
    });
  };

  let qCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Check for Question start: "1.", "1)", "Q1:", "Q:", "Question 1:"
    const qMatch = line.match(/^(?:(?:q(?:uestion)?\s*\d*[:.-]?|\d+[\).:-]))\s*(.+)$/i);
    if (qMatch && !line.match(/^[a-d][\).:-]/i)) {
      if (currentQuestion) {
        finalizeCurrent(qCount);
      }
      qCount++;
      currentQuestion = qMatch[1].trim();
      currentOptions = [];
      currentAnswerIndex = 0;
      currentExplanation = '';
      continue;
    }

    // Check for Options: A), B), C), D) or A., B., C., D. or 1), 2), 3), 4)
    const optMatch = line.match(/^[\(]?([a-dA-D1-4])[\).:-]\s*(.+)$/);
    if (optMatch && currentQuestion && currentOptions.length < 4) {
      const text = optMatch[2].trim();
      currentOptions.push(text);
      continue;
    }

    // Check for Answer: "Answer: A", "Ans: B", "Correct: C"
    const ansMatch = line.match(/^(?:ans(?:wer)?|correct(?:\s*answer)?|key)[:\s]+([a-dA-D1-4])/i);
    if (ansMatch && currentQuestion) {
      const letter = ansMatch[1].toUpperCase();
      if (letter === 'A' || letter === '1') currentAnswerIndex = 0;
      else if (letter === 'B' || letter === '2') currentAnswerIndex = 1;
      else if (letter === 'C' || letter === '3') currentAnswerIndex = 2;
      else if (letter === 'D' || letter === '4') currentAnswerIndex = 3;
      continue;
    }

    // Check for Explanation: "Explanation: ...", "Exp: ..."
    const expMatch = line.match(/^(?:exp(?:lanation)?|rationale|reason)[:\s]+(.+)$/i);
    if (expMatch && currentQuestion) {
      currentExplanation = expMatch[1].trim();
      continue;
    }

    // If currentQuestion exists and we don't have 4 options yet, append to question
    if (currentQuestion && currentOptions.length === 0) {
      currentQuestion += ' ' + line;
    } else if (currentExplanation) {
      currentExplanation += ' ' + line;
    }
  }

  // Finalize last question
  if (currentQuestion) {
    finalizeCurrent(qCount);
  }

  const validatedQuestions: Question[] = [];
  for (const draft of drafts) {
    const qObj: Question = {
      id: safeUUID(),
      topic_id: topicId || null,
      question: draft.question,
      options: draft.options,
      answer_index: draft.answer_index,
      explanation: draft.explanation,
      source: 'seed',
      flagged: false,
      created_at: new Date().toISOString(),
    };

    const parse = QuestionSchema.safeParse(qObj);
    if (parse.success) {
      validatedQuestions.push(qObj);
    } else {
      errors.push(`Validation error on "${draft.question.slice(0, 30)}...": ${parse.error.issues[0]?.message || 'Invalid format'}`);
    }
  }

  return {
    questions: validatedQuestions,
    errors,
  };
}

export const SAMPLE_BULK_QUIZ_TEXT = `1. What does ACID stand for in database management systems?
A) Atomicity, Consistency, Isolation, Durability
B) Accuracy, Concurrency, Integrity, Data
C) Access, Control, Index, Distribution
D) Algorithm, Computation, Integration, Database
Answer: A
Explanation: ACID is the acronym representing the four key properties of database transactions: Atomicity, Consistency, Isolation, and Durability.

2. Which normal form eliminates transitive functional dependencies?
A) First Normal Form (1NF)
B) Second Normal Form (2NF)
C) Third Normal Form (3NF)
D) Boyce-Codd Normal Form (BCNF)
Answer: C
Explanation: 3NF requires the relation to be in 2NF and have no non-prime attribute transitively dependent on any candidate key.

3. In SQL, which clause is used to filter groups created by GROUP BY?
A) WHERE
B) HAVING
C) ORDER BY
D) FILTER
Answer: B
Explanation: HAVING filters groups after aggregation, whereas WHERE filters individual rows before aggregation.`;

