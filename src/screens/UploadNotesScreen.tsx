import React, { useState, useEffect } from 'react';
import {
  FileText,
  Play,
  Trash2,
  Flag,
  RotateCcw,
} from 'lucide-react';
import { extractTextFromPdf } from '../lib/pdfExtractor';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  getAllTopics,
  flagQuestion,
  saveGeneratedQuestions,
} from '../lib/storage';
import { generateQuestionsFromNotes } from '../lib/notesQuizGenerator';
import {
  SugarySparkles,
  SugaryAlert,
  SugaryBook,
  SugaryLightbulb,
} from '../components/SugaryIcons';
import type { Question, Topic } from '../types/database';

interface UploadNotesScreenProps {
  onStartQuiz: (topicId: string, topicTitle: string, questions: Question[]) => void;
}

export const UploadNotesScreen: React.FC<UploadNotesScreenProps> = ({ onStartQuiz }) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [customTopicName, setCustomTopicName] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Process and step tracking
  const [status, setStatus] = useState<
    'idle' | 'extracting' | 'uploading' | 'generating' | 'saving' | 'ready' | 'error'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0); // 1: Extract, 2: Generate, 3: Save
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  useEffect(() => {
    getAllTopics().then((res) => {
      setTopics(res);
      if (res.length > 0) setSelectedTopicId(res[0].id);
    });
  }, []);

  const handleSelectFile = (selected: File) => {
    if (selected.type !== 'application/pdf' && !selected.name.endsWith('.pdf')) {
      setStatus('error');
      setStatusMessage('Error: Only PDF documents are supported.');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setStatus('error');
      setStatusMessage('Error: File size exceeds the 10 MB limit. Please upload a smaller PDF.');
      return;
    }

    setFile(selected);
    setStatus('idle');
    setStatusMessage('');
    setGeneratedQuestions([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcessPdf = async () => {
    if (!file) return;

    setStatus('extracting');
    setCurrentStep(1);
    setStatusMessage('Extracting text from PDF in browser...');

    try {
      // 1. Browser text extraction with page progress
      const extraction = await extractTextFromPdf(file, (curr, total) => {
        setStatusMessage(`Extracting page ${curr} of ${total}...`);
      });

      if (extraction.isScanned || !extraction.text || extraction.text.length < 50) {
        setStatus('error');
        setStatusMessage('This PDF looks scanned. Upload a text-based PDF.');
        return;
      }

      // 2. Optional upload original PDF to Supabase Storage
      if (isSupabaseConfigured() && user) {
        try {
          setStatus('uploading');
          setStatusMessage('Backing up PDF to your secure notes vault...');
          const storagePath = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const { error: uploadErr } = await supabase.storage.from('notes').upload(storagePath, file);
          if (!uploadErr) {
            await supabase.from('notes').insert({
              user_id: user.id,
              title: file.name,
              storage_path: storagePath,
            });
          }
        } catch (storageErr) {
          console.warn('Supabase storage upload notice:', storageErr);
        }
      }

      // 3. Question Generation via Edge Function
      setStatus('generating');
      setCurrentStep(2);
      setStatusMessage(`Synthesizing ${questionCount} conceptual MCQs via Edge AI...`);

      const chosenChunk = extraction.chunks[0] || extraction.text.slice(0, 15000);
      const effectiveTopicId = selectedTopicId === 'custom' ? null : selectedTopicId;

      let questionsRaw: Question[] = [];

      // Try Edge Function if configured
      let edgeSucceeded = false;
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.functions.invoke('generate-questions', {
            body: {
              text: chosenChunk,
              topicId: effectiveTopicId,
              count: questionCount,
              difficulty,
            },
          });

          if (!error && data?.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            questionsRaw = data.questions;
            edgeSucceeded = true;
          }
        } catch (edgeErr) {
          console.warn('Supabase Edge Function notice, using intelligent notes synthesizer fallback:', edgeErr);
        }
      }

      // If Edge Function not deployed or unreachable, run intelligent notes-to-quiz synthesizer
      if (!edgeSucceeded || questionsRaw.length === 0) {
        setStatusMessage(`Analyzing document structure and synthesizing ${questionCount} MCQs from notes...`);
        questionsRaw = await generateQuestionsFromNotes({
          text: chosenChunk,
          topicId: effectiveTopicId,
          count: questionCount,
          difficulty,
        });
      }

      // 4. Save to local storage for instant availability
      setStatus('saving');
      setCurrentStep(3);
      setStatusMessage('Finalizing and saving questions...');

      await saveGeneratedQuestions(questionsRaw);

      setGeneratedQuestions(questionsRaw);
      setStatus('ready');
      setStatusMessage(`Successfully generated ${questionsRaw.length} syllabus MCQs!`);
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setStatus('error');
      setStatusMessage(err?.message || 'Failed to process notes PDF.');
    }
  };

  const handleDeleteQuestion = (indexToDelete: number) => {
    setGeneratedQuestions((prev) => prev.filter((_, idx) => idx !== indexToDelete));
  };

  const handleFlagQuestion = async (q: Question) => {
    if (q.id) {
      await flagQuestion(q.id);
    }
    setGeneratedQuestions((prev) =>
      prev.map((item) => (item.id === q.id ? { ...item, flagged: true } : item))
    );
  };

  const handleStart = () => {
    if (generatedQuestions.length === 0) return;
    const topicTitle =
      selectedTopicId === 'custom'
        ? customTopicName.trim() || 'Custom Notes Topic'
        : topics.find((t) => t.id === selectedTopicId)?.title || 'Notes to Quiz';

    onStartQuiz(selectedTopicId || 'notes-quiz', topicTitle, generatedQuestions);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 text-left">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/80 border border-indigo-100/90 shadow-[0_8px_24px_rgba(79,70,229,0.06)] p-6 sm:p-9 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-indigo-700 mb-3 border border-indigo-100 shadow-xs">
            <SugarySparkles size={18} />
            <span>AI Syllabus Synthesis</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
            Notes-to-Quiz AI
          </h1>
          <p className="mt-2 text-xs sm:text-base text-slate-600 leading-relaxed font-medium">
            Upload lecture slides or textbook notes. Our AI analyzes facts directly from your pages and generates verified exam MCQs.
          </p>
        </div>
      </div>

      {/* Main Upload & Configuration Card */}
      <div className="bg-white border border-slate-200/80 shadow-[0_12px_36px_rgba(0,0,0,0.03)] p-6 sm:p-9 rounded-3xl space-y-6">
        
        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-7 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/80 scale-[1.01]'
              : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60'
          }`}
        >
          <label htmlFor="pdf-upload" className="w-full flex flex-col items-center cursor-pointer">
            <div className="w-16 h-16 rounded-3xl bg-white border border-indigo-100 flex items-center justify-center shadow-xs mb-3">
              {file ? <FileText className="w-8 h-8 text-indigo-600" /> : <SugaryBook size={38} />}
            </div>

            <span className="text-base sm:text-lg font-bold text-slate-900 text-center">
              {file ? file.name : 'Choose PDF document or drag & drop here'}
            </span>
            <span className="text-xs text-slate-500 mt-1 text-center">
              Lecture slides, professor handouts, or study notes (.pdf up to 10MB)
            </span>

            <input
              id="pdf-upload"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Selected File Badge & Configuration Controls */}
        {file && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block truncate max-w-xs sm:max-w-md">
                    {file.name}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {(file.size / 1024).toFixed(1)} KB PDF · Ready for processing
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setFile(null); setGeneratedQuestions([]); setStatus('idle'); }}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Change File
              </button>
            </div>

            {/* Syllabus Topic & Parameters Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              
              {/* 1. Target Topic Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Topic
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                  <option value="custom">+ Create New Custom Topic</option>
                </select>

                {selectedTopicId === 'custom' && (
                  <input
                    type="text"
                    value={customTopicName}
                    onChange={(e) => setCustomTopicName(e.target.value)}
                    placeholder="Enter custom topic name..."
                    className="mt-2 w-full text-xs p-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none"
                  />
                )}
              </div>

              {/* 2. Number of Questions (5, 10, 15) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Question Count
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        questionCount === cnt
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cnt} MCQs
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Difficulty */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`py-2 text-xs font-bold rounded-xl border capitalize transition-all cursor-pointer ${
                        difficulty === lvl
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={status === 'extracting' || status === 'generating' || status === 'uploading'}
                onClick={handleProcessPdf}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-full text-base font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <SugarySparkles size={18} />
                <span>
                  {status === 'extracting'
                    ? 'Extracting PDF text...'
                    : status === 'generating'
                    ? `Generating ${questionCount} MCQs...`
                    : `Generate ${questionCount} MCQs from PDF`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Step-by-Step Progress Pipeline */}
        {(status === 'extracting' || status === 'uploading' || status === 'generating' || status === 'saving') && (
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
              <span className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                <span>{statusMessage}</span>
              </span>
              <span className="font-mono">Step {currentStep} of 3</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
              <div className={`p-2 rounded-xl text-center ${currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                1. Text Extract
              </div>
              <div className={`p-2 rounded-xl text-center ${currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                2. AI Synthesis
              </div>
              <div className={`p-2 rounded-xl text-center ${currentStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                3. Save & Review
              </div>
            </div>
          </div>
        )}

        {/* Status Error Display with Retry */}
        {status === 'error' && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm font-bold">
            <div className="flex items-center gap-2">
              <SugaryAlert size={20} className="shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button
              type="button"
              onClick={handleProcessPdf}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-rose-300 text-rose-800 text-xs font-bold hover:bg-rose-100 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

      </div>

      {/* Question Preview & Moderation List */}
      {status === 'ready' && generatedQuestions.length > 0 && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3">
              <SugaryLightbulb size={32} />
              <div>
                <span className="text-base font-black text-slate-900 block">
                  {generatedQuestions.length} Questions Ready for Quiz!
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Review questions below, delete unwanted items, or click to start immediately.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStart}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-full text-base font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap hover:-translate-y-0.5 active:translate-y-0 transition-transform"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Quiz ({generatedQuestions.length} MCQs)</span>
            </button>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {generatedQuestions.map((q, qIdx) => (
              <div
                key={q.id || qIdx}
                className={`p-5 rounded-2xl bg-white border transition-all ${
                  q.flagged ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-mono text-xs font-bold">
                      {qIdx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      MCQ
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Report wrong question"
                      onClick={() => handleFlagQuestion(q)}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        q.flagged
                          ? 'text-amber-700 bg-amber-100'
                          : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span className="text-[11px]">{q.flagged ? 'Flagged' : 'Report'}</span>
                    </button>

                    <button
                      type="button"
                      title="Remove question from quiz"
                      onClick={() => handleDeleteQuestion(qIdx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug mb-3">
                  {q.question}
                </h3>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === q.answer_index;
                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>
                          {String.fromCharCode(65 + optIdx)}. {opt}
                        </span>
                        {isCorrect && (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800">Rationale:</div>
                  <div>{q.explanation}</div>
                  {q.source_passage && (
                    <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                      Source Quote: "{q.source_passage}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
