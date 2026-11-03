import React, { useState } from 'react';
import {
  PenTool,
  Sparkles,
  FileText,
  ClipboardPaste,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { safeUUID, saveCustomTopic, saveGeneratedQuestions } from '../lib/storage';
import { generateQuestionsFromTopicPrompt } from '../lib/notesQuizGenerator';
import { parseBulkQuestionsText, SAMPLE_BULK_QUIZ_TEXT } from '../lib/bulkQuizParser';
import { UploadNotesScreen } from './UploadNotesScreen';
import {
  SugarySparkles,
  SugaryAlert,
} from '../components/SugaryIcons';
import type { Question, Topic } from '../types/database';

interface CreateQuizScreenProps {
  onStartQuiz: (topicId: string, topicTitle: string, questions: Question[]) => void;
  initialMode?: 'manual' | 'ai-topic' | 'pdf' | 'bulk';
}

interface ManualDraftQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  answer_index: number;
  explanation: string;
}

export const CreateQuizScreen: React.FC<CreateQuizScreenProps> = ({
  onStartQuiz,
  initialMode = 'manual',
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai-topic' | 'pdf' | 'bulk'>(initialMode);

  // ----------------------------------------------------
  // 1. Manual Builder State
  // ----------------------------------------------------
  const [manualTitle, setManualTitle] = useState('My Custom Quiz');
  const [manualQuestions, setManualQuestions] = useState<ManualDraftQuestion[]>([
    {
      id: safeUUID(),
      question: '',
      options: ['', '', '', ''],
      answer_index: 0,
      explanation: '',
    },
  ]);
  const [manualError, setManualError] = useState<string | null>(null);

  const handleAddManualQuestion = () => {
    setManualQuestions((prev) => [
      ...prev,
      {
        id: safeUUID(),
        question: '',
        options: ['', '', '', ''],
        answer_index: 0,
        explanation: '',
      },
    ]);
  };

  const handleUpdateManualQuestion = (index: number, field: string, value: any) => {
    setManualQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    setManualQuestions((prev) => {
      const updated = [...prev];
      const newOpts = [...updated[qIndex].options] as [string, string, string, string];
      newOpts[optIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: newOpts };
      return updated;
    });
  };

  const handleDeleteManualQuestion = (index: number) => {
    if (manualQuestions.length <= 1) return;
    setManualQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDuplicateManualQuestion = (index: number) => {
    const target = manualQuestions[index];
    setManualQuestions((prev) => [
      ...prev.slice(0, index + 1),
      {
        ...target,
        id: safeUUID(),
        question: `${target.question} (Copy)`,
      },
      ...prev.slice(index + 1),
    ]);
  };

  const handleSaveAndStartManualQuiz = async () => {
    setManualError(null);
    const title = manualTitle.trim() || 'Custom Quiz';

    // Validation
    for (let i = 0; i < manualQuestions.length; i++) {
      const q = manualQuestions[i];
      if (!q.question.trim()) {
        setManualError(`Question ${i + 1} is empty. Please enter a question prompt.`);
        return;
      }
      for (let o = 0; o < 4; o++) {
        if (!q.options[o].trim()) {
          setManualError(
            `Question ${i + 1}: Option ${['A', 'B', 'C', 'D'][o]} is empty. All 4 options are required.`
          );
          return;
        }
      }
    }

    const createdTopic: Topic = {
      id: safeUUID(),
      unit_id: 'unit-manual-quiz',
      title,
      order_index: 0,
    };
    await saveCustomTopic(createdTopic);

    const questions: Question[] = manualQuestions.map((q) => ({
      id: safeUUID(),
      topic_id: createdTopic.id,
      question: q.question.trim(),
      options: [q.options[0].trim(), q.options[1].trim(), q.options[2].trim(), q.options[3].trim()],
      answer_index: q.answer_index,
      explanation:
        q.explanation.trim() ||
        `🎯 **Core Concept**: Option ${['A', 'B', 'C', 'D'][q.answer_index]} is correct.`,
      source: 'seed',
      flagged: false,
      created_at: new Date().toISOString(),
    }));

    await saveGeneratedQuestions(questions);
    onStartQuiz(createdTopic.id, createdTopic.title, questions);
  };

  // ----------------------------------------------------
  // 2. AI Topic Prompt State
  // ----------------------------------------------------
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [aiSubjectContext, setAiSubjectContext] = useState('');
  const [aiCount, setAiCount] = useState<number>(10);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateAiQuiz = async () => {
    if (!aiTopicInput.trim()) {
      setAiError('Please enter a topic or concept prompt.');
      return;
    }
    setAiError(null);
    setAiLoading(true);

    try {
      const title = aiTopicInput.trim();
      const createdTopic: Topic = {
        id: safeUUID(),
        unit_id: 'unit-ai-quiz',
        title,
        order_index: 0,
      };
      await saveCustomTopic(createdTopic);

      const generated = await generateQuestionsFromTopicPrompt({
        topicTitle: title,
        count: aiCount,
        difficulty: aiDifficulty,
        subjectContext: aiSubjectContext.trim() || undefined,
        topicId: createdTopic.id,
      });

      await saveGeneratedQuestions(generated);
      onStartQuiz(createdTopic.id, createdTopic.title, generated);
    } catch (err: any) {
      console.error(err);
      setAiError(err?.message || 'Failed to generate AI quiz. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // ----------------------------------------------------
  // 3. Bulk Text Import State
  // ----------------------------------------------------
  const [bulkTitle, setBulkTitle] = useState('Imported Question Bank');
  const [bulkRawText, setBulkRawText] = useState('');
  const [bulkParsedQuestions, setBulkParsedQuestions] = useState<Question[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkStatusMessage, setBulkStatusMessage] = useState<string | null>(null);

  const handleParseBulkText = () => {
    setBulkErrors([]);
    setBulkStatusMessage(null);
    if (!bulkRawText.trim()) {
      setBulkErrors(['Please paste your questions text into the box below.']);
      return;
    }

    const { questions, errors } = parseBulkQuestionsText(bulkRawText);
    setBulkParsedQuestions(questions);
    setBulkErrors(errors);

    if (questions.length > 0) {
      setBulkStatusMessage(`Successfully parsed ${questions.length} questions ready to play!`);
    } else {
      setBulkErrors(
        errors.length > 0
          ? errors
          : ['No valid questions found. Check that questions have 4 options (A-D) and an Answer line.']
      );
    }
  };

  const handleStartBulkQuiz = async () => {
    if (bulkParsedQuestions.length === 0) return;
    const title = bulkTitle.trim() || 'Imported Quiz';

    const createdTopic: Topic = {
      id: safeUUID(),
      unit_id: 'unit-bulk-quiz',
      title,
      order_index: 0,
    };
    await saveCustomTopic(createdTopic);

    const questions = bulkParsedQuestions.map((q) => ({
      ...q,
      id: safeUUID(),
      topic_id: createdTopic.id,
    }));

    await saveGeneratedQuestions(questions);
    onStartQuiz(createdTopic.id, createdTopic.title, questions);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 text-left">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/80 border border-indigo-100/90 shadow-[0_8px_24px_rgba(79,70,229,0.06)] p-6 sm:p-9 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-indigo-700 mb-3 border border-indigo-100 shadow-xs">
            <SugarySparkles size={18} />
            <span>Quiz Creation Studio</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
            Create Custom Quizzes
          </h1>
          <p className="mt-2 text-xs sm:text-base text-slate-600 leading-relaxed font-medium max-w-xl">
            Choose your favorite way to create: write questions manually, generate with AI from any prompt, upload 100MB lecture notes, or paste bulk questions.
          </p>
        </div>
      </div>

      {/* 4 Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 select-none">
        {[
          { id: 'manual' as const, label: 'Manual Builder', icon: PenTool, desc: 'Question-by-Question' },
          { id: 'ai-topic' as const, label: 'AI Prompt', icon: Sparkles, desc: 'Instant Topic Quiz' },
          { id: 'pdf' as const, label: 'Notes & PDFs', icon: FileText, desc: 'Up to 100MB & OCR' },
          { id: 'bulk' as const, label: 'Bulk Paste', icon: ClipboardPaste, desc: 'Text Import' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 rounded-xl flex flex-col items-center sm:items-start text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100 font-black scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className="text-xs sm:text-sm font-bold">{tab.label}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                {tab.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODE 1: Manual Builder */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          {/* Quiz Metadata Card */}
          <div className="bg-white border border-slate-200/80 shadow-xs p-6 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quiz Title / Subject
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Operating Systems: Process Scheduling Quiz"
                  className="w-full text-base font-bold p-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 self-start sm:self-end">
                <button
                  type="button"
                  onClick={handleSaveAndStartManualQuiz}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-transform whitespace-nowrap"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Quiz ({manualQuestions.length} Questions)</span>
                </button>
              </div>
            </div>

            {manualError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <SugaryAlert size={16} />
                <span>{manualError}</span>
              </div>
            )}
          </div>

          {/* List of Manual Questions */}
          <div className="space-y-4">
            {manualQuestions.map((q, qIndex) => (
              <div
                key={q.id}
                className="bg-white border border-slate-200/80 shadow-xs p-6 rounded-3xl space-y-4 transition-all hover:border-indigo-200"
              >
                {/* Question Header & Controls */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-mono text-xs font-extrabold">
                      {qIndex + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Question {qIndex + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDuplicateManualQuestion(qIndex)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Duplicate question"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {manualQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteManualQuestion(qIndex)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Question Statement
                  </label>
                  <textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => handleUpdateManualQuestion(qIndex, 'question', e.target.value)}
                    placeholder="Enter your question here..."
                    className="w-full text-sm font-semibold p-3 rounded-2xl border border-slate-200 bg-slate-50/40 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
                  />
                </div>

                {/* 4 Options Grid with Correct Answer Radio */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Options (Select the radio icon for the correct answer)</span>
                    <span className="text-indigo-600">
                      Correct Answer: Option {['A', 'B', 'C', 'D'][q.answer_index]}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIndex) => {
                      const isCorrect = q.answer_index === optIndex;
                      const letters = ['A', 'B', 'C', 'D'];
                      return (
                        <div
                          key={optIndex}
                          className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${
                            isCorrect
                              ? 'border-emerald-300 bg-emerald-50/50 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleUpdateManualQuestion(qIndex, 'answer_index', optIndex)}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 cursor-pointer transition-all ${
                              isCorrect
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={`Set Option ${letters[optIndex]} as correct`}
                          >
                            {letters[optIndex]}
                          </button>

                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                            placeholder={`Option ${letters[optIndex]} text...`}
                            className="w-full text-xs font-semibold p-1.5 bg-transparent border-none focus:outline-none text-slate-900"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Explanation (Optional - shown after answering)
                  </label>
                  <input
                    type="text"
                    value={q.explanation}
                    onChange={(e) => handleUpdateManualQuestion(qIndex, 'explanation', e.target.value)}
                    placeholder="Why is this option correct? (Theory, formulas, or memory hints)..."
                    className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-slate-50/30 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            ))}

            {/* Add Question Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-3xl">
              <button
                type="button"
                onClick={handleAddManualQuestion}
                className="inline-flex items-center gap-2 text-indigo-700 hover:text-indigo-900 font-bold text-sm px-5 py-2.5 rounded-full bg-white border border-indigo-200 shadow-xs hover:bg-indigo-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Question</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndStartManualQuiz}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-transform"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Save & Start Quiz ({manualQuestions.length} MCQs)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODE 2: AI Prompt / Topic Generator */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'ai-topic' && (
        <div className="bg-white border border-slate-200/80 shadow-xs p-6 sm:p-9 rounded-3xl space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Direct AI Generation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Generate Quiz from Any Topic Prompt
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              No notes needed! Type any college concept, exam syllabus topic, or specific mechanism. Gemini AI generates scenario-grounded MCQs instantly.
            </p>
          </div>

          <div className="space-y-4">
            {/* Topic Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Topic or Concept Prompt *
              </label>
              <input
                type="text"
                value={aiTopicInput}
                onChange={(e) => setAiTopicInput(e.target.value)}
                placeholder="e.g. Operating Systems: Deadlock Detection & Banker's Algorithm"
                className="w-full text-sm font-bold p-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs"
              />
            </div>

            {/* Optional Subject Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject / Academic Field (Optional)
              </label>
              <input
                type="text"
                value={aiSubjectContext}
                onChange={(e) => setAiSubjectContext(e.target.value)}
                placeholder="e.g. Computer Science Engineering, GATE Exam Prep, Medical, Law..."
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            {/* Quick Inspiration Pills */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                Popular Examples (Click to Fill):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'DBMS BCNF vs 3NF Decomposition',
                  'TCP vs UDP 3-Way Handshake',
                  'Binary Trees & AVL Balancing',
                  'Python AsyncIO & Event Loop',
                  'Digital Logic Karnaugh Maps',
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setAiTopicInput(sample);
                      setAiSubjectContext('Computer Science');
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors cursor-pointer"
                  >
                    + {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Question Count */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Question Count
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 15, 20].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setAiCount(cnt)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        aiCount === cnt
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { lvl: 'easy' as const, label: 'Easy', emoji: '🟢' },
                    { lvl: 'medium' as const, label: 'Medium', emoji: '🟡' },
                    { lvl: 'hard' as const, label: 'Hard', emoji: '🔴' },
                  ].map(({ lvl, label, emoji }) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setAiDifficulty(lvl)}
                      className={`py-2 text-xs font-bold rounded-xl border capitalize transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        aiDifficulty === lvl
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {aiError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <SugaryAlert size={18} />
                <span>{aiError}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={aiLoading}
                onClick={handleGenerateAiQuiz}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-full text-base font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                {aiLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Synthesizing University MCQs via Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate & Start Quiz ({aiCount} MCQs)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODE 3: PDF / Document Notes Synthesizer (100MB & Multi-PDF) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'pdf' && (
        <UploadNotesScreen onStartQuiz={onStartQuiz} />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODE 4: Bulk Text / Paste Import */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'bulk' && (
        <div className="bg-white border border-slate-200/80 shadow-xs p-6 sm:p-9 rounded-3xl space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full mb-2">
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Bulk Text Parser</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Paste Any Questions Text / Question Bank
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Copy-paste questions from Google Docs, WhatsApp, PDFs, or teacher notes. Our smart parser converts them into an interactive quiz in seconds.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quiz Title
              </label>
              <input
                type="text"
                value={bulkTitle}
                onChange={(e) => setBulkTitle(e.target.value)}
                placeholder="e.g. Midterm Question Bank"
                className="w-full text-sm font-bold p-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Raw Questions Text
                </label>
                <button
                  type="button"
                  onClick={() => setBulkRawText(SAMPLE_BULK_QUIZ_TEXT)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer underline"
                >
                  Load Example Questions Template
                </button>
              </div>

              <textarea
                rows={10}
                value={bulkRawText}
                onChange={(e) => setBulkRawText(e.target.value)}
                placeholder={`1. What is the time complexity of binary search?\nA) O(n)\nB) O(log n)\nC) O(n log n)\nD) O(1)\nAnswer: B\nExplanation: Divides search space in half at each step.\n\n2. Next question...`}
                className="w-full font-mono text-xs p-3.5 rounded-2xl border border-slate-200 bg-slate-50/40 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white resize-y"
              />
            </div>

            {/* Error or Success Alerts */}
            {bulkErrors.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <SugaryAlert size={16} />
                  <span>Parsing Notice:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5">
                  {bulkErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {bulkStatusMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bulkStatusMessage}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleParseBulkText}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Parse Questions</span>
              </button>

              {bulkParsedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={handleStartBulkQuiz}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Quiz ({bulkParsedQuestions.length} Questions)</span>
                </button>
              )}
            </div>

            {/* Parsed Preview Cards */}
            {bulkParsedQuestions.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                  Parsed Questions Preview ({bulkParsedQuestions.length})
                </span>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {bulkParsedQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-1.5"
                    >
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <span className="text-indigo-600 font-mono">Q{idx + 1}.</span>
                        <span>{q.question}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-1.5 rounded-lg border ${
                              q.answer_index === optIdx
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <span className="font-mono font-bold mr-1">
                              {['A', 'B', 'C', 'D'][optIdx]}:
                            </span>
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
