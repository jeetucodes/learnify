import React, { useState } from 'react';
import {
  FileText,
  Play,
} from 'lucide-react';
import { extractTextFromPdf, computeContentHash } from '../lib/pdfExtractor';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  getCachedQuestionsByHash,
  saveGeneratedQuestions,
  generateFallbackQuestionsFromText,
  GeneratedQuizSchema,
} from '../lib/storage';
import {
  SugarySparkles,
  SugaryCheck,
  SugaryAlert,
  SugaryBook,
  SugaryLightbulb,
} from '../components/SugaryIcons';
import type { Question } from '../types/database';

interface UploadNotesScreenProps {
  onStartQuiz: (topicId: string, topicTitle: string, questions: Question[]) => void;
}

export const UploadNotesScreen: React.FC<UploadNotesScreenProps> = ({ onStartQuiz }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'extracting' | 'cached' | 'generating' | 'ready' | 'error'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf' && !selected.name.endsWith('.pdf')) {
        setStatus('error');
        setStatusMessage('Error: Only PDF documents are supported.');
        return;
      }
      setFile(selected);
      setStatus('idle');
      setStatusMessage('');
      setGeneratedQuestions([]);
    }
  };

  const processTextAndGenerateQuiz = async (text: string) => {
    try {
      if (!text || text.trim().length < 20) {
        throw new Error('Extracted text payload is too short. Please provide a document with at least 20 characters.');
      }

      setStatus('generating');
      setStatusMessage('Checking smart cache...');
      const hash = await computeContentHash(text);

      const cached = await getCachedQuestionsByHash(hash);
      if (cached && cached.length >= 5) {
        setGeneratedQuestions(cached);
        setStatus('ready');
        setStatusMessage('Instant hit! Loaded from cache (0 AI tokens consumed).');
        return;
      }

      let questionsRaw: any = null;

      if (isSupabaseConfigured()) {
        try {
          setStatusMessage('Generating 10 MCQs via Gemini AI...');
          const { data, error } = await supabase.functions.invoke('generate-quiz', {
            body: { text, content_hash: hash },
          });

          if (!error && data?.questions) {
            questionsRaw = data.questions;
          }
        } catch (edgeErr) {
          console.warn('Edge function unavailable, using local synthesis:', edgeErr);
        }
      }

      if (!questionsRaw) {
        setStatusMessage('Synthesizing 10 conceptual MCQs from notes...');
        questionsRaw = generateFallbackQuestionsFromText(text);
      }

      const validated = GeneratedQuizSchema.parse({ questions: questionsRaw });

      const saved = await saveGeneratedQuestions(
        validated.questions.map((q) => ({
          ...q,
          topic_id: null,
          source: 'ai' as const,
          flagged: false,
        })),
        hash
      );

      setGeneratedQuestions(saved);
      setStatus('ready');
      setStatusMessage(`Generated ${saved.length} questions successfully!`);
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setStatus('error');
      setStatusMessage(err?.message || 'Failed to process PDF notes.');
    }
  };

  const handleProcessPdf = async () => {
    if (!file) return;

    setStatus('extracting');
    setStatusMessage('Reading PDF text in browser via pdfjs-dist...');

    try {
      const text = await extractTextFromPdf(file);
      await processTextAndGenerateQuiz(text);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setStatusMessage('Failed to parse text from the uploaded PDF document.');
    }
  };

  const handleStart = () => {
    if (generatedQuestions.length === 0) return;
    const title = file ? `Notes: ${file.name.replace('.pdf', '')}` : 'AI Generated Notes Quiz';
    onStartQuiz('notes-quiz', title, generatedQuestions);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 text-left">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/80 border border-indigo-100/90 shadow-[0_8px_24px_rgba(79,70,229,0.06)] p-6 sm:p-10 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-indigo-700 mb-3 border border-indigo-100 shadow-xs">
            <SugarySparkles size={18} />
            <span>AI Syllabus Synthesis</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
            Notes-to-Quiz AI
          </h1>
          <p className="mt-2 text-xs sm:text-base text-slate-600 leading-relaxed font-medium">
            Upload your lecture slides or college notes. We extract key concepts and generate 10 syllabus-aligned MCQs with explanations.
          </p>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white border border-slate-200/80 shadow-[0_12px_36px_rgba(0,0,0,0.03)] p-8 sm:p-10 rounded-3xl space-y-6 text-center">
        
        <label
          htmlFor="pdf-upload"
          className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer transition-all bg-indigo-50/30 hover:bg-indigo-50/60 group"
        >
          <div className="w-16 h-16 rounded-3xl bg-white border border-indigo-100 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-4">
            <SugaryBook size={38} />
          </div>

          <span className="text-lg font-bold text-slate-900">
            {file ? file.name : 'Choose PDF or drag & drop'}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Accepts lecture slides, class handouts, or notes (.pdf up to 10MB)
          </span>

          <input
            id="pdf-upload"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {file && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600" />
              <div>
                <span className="text-sm font-bold text-slate-900 block truncate max-w-xs">
                  {file.name}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {(file.size / 1024).toFixed(1)} KB PDF
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={status === 'extracting' || status === 'generating'}
              onClick={handleProcessPdf}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 w-full sm:w-auto justify-center transition-all"
            >
              <SugarySparkles size={16} />
              <span>{status === 'extracting' || status === 'generating' ? 'Processing...' : 'Generate 10 MCQs'}</span>
            </button>
          </div>
        )}

        {/* Processing State Feedback */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 ${
              status === 'ready'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : status === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-900'
                : 'bg-indigo-50 border border-indigo-200 text-indigo-900'
            }`}
          >
            {status === 'ready' ? (
              <SugaryCheck size={18} className="shrink-0" />
            ) : status === 'error' ? (
              <SugaryAlert size={18} className="shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Ready to Play Quiz */}
        {status === 'ready' && generatedQuestions.length > 0 && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left flex items-center gap-3">
              <SugaryLightbulb size={32} />
              <div>
                <span className="text-sm font-black text-slate-900 block">
                  {generatedQuestions.length} Questions Ready!
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Syllabus-aligned with answer rationales and explanations.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStart}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-full text-base font-bold flex items-center gap-2 shadow-sm cursor-pointer w-full sm:w-auto justify-center transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start AI Quiz Now</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
