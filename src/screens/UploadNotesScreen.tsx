import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Play,
  UploadCloud,
} from 'lucide-react';
import { extractTextFromPdf, computeContentHash } from '../lib/pdfExtractor';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  getCachedQuestionsByHash,
  saveGeneratedQuestions,
  generateFallbackQuestionsFromText,
  GeneratedQuizSchema,
} from '../lib/storage';
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
    <div className="max-w-3xl mx-auto space-y-6 pb-20 text-left font-clay">
      
      {/* Header Banner (Violet Cushion) */}
      <div className="clay-cushion-violet p-6 sm:p-10 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FFFDF7]/70 px-3.5 py-1 text-xs font-bold text-[var(--dp-color-ink)] mb-3 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[var(--dp-color-primary-action)]" />
            <span>AI Syllabus Synthesis</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--dp-color-ink)] leading-tight">
            Notes-to-Quiz AI
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--dp-color-ink-secondary)] leading-relaxed">
            Upload your lecture slides or college notes. We extract key concepts and generate 10 syllabus-aligned MCQs with explanations.
          </p>
        </div>
      </div>

      {/* Upload Dropzone in Cream Tray */}
      <div className="clay-tray-cream p-8 sm:p-10 rounded-3xl space-y-6 text-center">
        
        <label
          htmlFor="pdf-upload"
          className="clay-recessed-well border-2 border-dashed border-[#4A3FD1]/30 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--dp-color-primary-action)] transition-all bg-[#EEF0FB]/50 group"
        >
          <div className="w-16 h-16 rounded-3xl bg-[var(--dp-color-surface)] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-4">
            <UploadCloud className="w-8 h-8 text-[var(--dp-color-primary-action)]" />
          </div>

          <span className="text-lg font-bold text-[var(--dp-color-ink)]">
            {file ? file.name : 'Choose PDF or drag & drop'}
          </span>
          <span className="text-xs text-[var(--dp-color-ink-secondary)] mt-1">
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#EEF0FB] text-left">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-[var(--dp-color-primary-action)]" />
              <div>
                <span className="text-sm font-bold text-[var(--dp-color-ink)] block truncate max-w-xs">
                  {file.name}
                </span>
                <span className="text-xs text-[var(--dp-color-ink-secondary)]">
                  {(file.size / 1024).toFixed(1)} KB PDF
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={status === 'extracting' || status === 'generating'}
              onClick={handleProcessPdf}
              className="clay-btn-primary px-6 py-2.5 text-sm font-bold flex items-center gap-2 clay-focus cursor-pointer disabled:opacity-50 w-full sm:w-auto justify-center"
            >
              <Sparkles className="w-4 h-4" />
              <span>{status === 'extracting' || status === 'generating' ? 'Processing...' : 'Generate 10 MCQs'}</span>
            </button>
          </div>
        )}

        {/* Processing State Feedback */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 ${
              status === 'ready'
                ? 'clay-cushion-mint text-[var(--dp-color-ink)]'
                : status === 'error'
                ? 'clay-tray-pink text-[#9F1239]'
                : 'clay-cushion-blue text-[var(--dp-color-ink)]'
            }`}
          >
            {status === 'ready' ? (
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            ) : status === 'error' ? (
              <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-[var(--dp-color-primary-action)] border-t-transparent animate-spin shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Ready to Play Quiz */}
        {status === 'ready' && generatedQuestions.length > 0 && (
          <div className="pt-4 border-t border-[#38315A]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-sm font-bold text-[var(--dp-color-ink)] block">
                {generatedQuestions.length} Questions Ready!
              </span>
              <span className="text-xs text-[var(--dp-color-ink-secondary)]">
                Syllabus-aligned with answer rationales and explanations.
              </span>
            </div>

            <button
              type="button"
              onClick={handleStart}
              className="clay-btn-primary px-8 py-3.5 text-base font-bold flex items-center gap-2 clay-focus cursor-pointer shadow-md w-full sm:w-auto justify-center"
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
