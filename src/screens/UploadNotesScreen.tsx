import React, { useState } from 'react';
import {
  FileText,
  Play,
  Trash2,
  Flag,
  RotateCcw,
  Lock,
  Plus,
  X,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  extractTextFromMultiplePdfs,
  type MultiPdfExtractionResult,
  type ProgressInfo,
} from '../lib/pdfExtractor';
import {
  MAX_PDF_SIZE_MB,
  MAX_BATCH_PDF_COUNT,
  validatePdfFile,
  formatFileSize,
} from '../lib/pdfConfig';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  safeUUID,
  flagQuestion,
  saveGeneratedQuestions,
  saveCustomTopic,
} from '../lib/storage';
import { generateQuestionsFromNotes } from '../lib/notesQuizGenerator';
import {
  detectTopicsFromPdfText,
  cleanFileNameToTitle,
  type PdfTopicAnalysis,
} from '../lib/pdfTopicDetector';
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
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Multi-PDF Extraction & Topic State
  const [extractedData, setExtractedData] = useState<MultiPdfExtractionResult | null>(null);
  const [analyzingTopics, setAnalyzingTopics] = useState(false);
  const [pdfAnalysis, setPdfAnalysis] = useState<PdfTopicAnalysis | null>(null);
  const [pdfMainTopic, setPdfMainTopic] = useState<string>('');
  const [selectedPdfTopic, setSelectedPdfTopic] = useState<string>('all');
  const [customSubtopic, setCustomSubtopic] = useState<string>('');

  // Quiz Configuration
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [autoStart, setAutoStart] = useState<boolean>(true);

  // Process and Step Tracking
  const [status, setStatus] = useState<
    'idle' | 'extracting' | 'uploading' | 'generating' | 'saving' | 'ready' | 'error'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  // Validation / Error state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleAddFiles = async (newFiles: FileList | File[]) => {
    setValidationErrors([]);
    setStatusMessage('');
    const validToAdd: File[] = [];
    const errors: string[] = [];

    const fileArray = Array.from(newFiles);

    for (const f of fileArray) {
      const validation = validatePdfFile(f);
      if (!validation.valid) {
        errors.push(validation.error || `Invalid file "${f.name}"`);
      } else {
        const alreadyExists = files.some(
          (existing) => existing.name === f.name && existing.size === f.size
        );
        if (!alreadyExists) {
          validToAdd.push(f);
        }
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
    }

    if (validToAdd.length === 0) return;

    const combined = [...files, ...validToAdd].slice(0, MAX_BATCH_PDF_COUNT);
    setFiles(combined);
    setGeneratedQuestions([]);
    setStatus('idle');

    // Automatically update initial title from clean file names
    const fileNames = combined.map((f) => f.name);
    const initialTitle = cleanFileNameToTitle(fileNames);
    setPdfMainTopic(initialTitle);
    setSelectedPdfTopic('all');
    setCustomSubtopic('');
    setAnalyzingTopics(true);

    // Run quick background topic extraction from the first document
    try {
      const quickExtraction = await extractTextFromMultiplePdfs(combined.slice(0, 2), (p) => {
        // quiet background progress
        if (p.percent > 0) setProgressPercent(p.percent);
      });
      setExtractedData(quickExtraction);

      if (quickExtraction.text && quickExtraction.text.length > 40) {
        const analysis = await detectTopicsFromPdfText(quickExtraction.text, fileNames);
        setPdfAnalysis(analysis);
        if (analysis.mainTopic) {
          setPdfMainTopic(analysis.mainTopic);
        }
      }
    } catch (err: any) {
      console.warn('Background topic detection note:', err);
    } finally {
      setAnalyzingTopics(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleAddFiles(e.target.files);
      // Reset input value to allow re-selecting same file if desired
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const updated = files.filter((_, idx) => idx !== indexToRemove);
    setFiles(updated);
    setExtractedData(null);
    setPdfAnalysis(null);
    setGeneratedQuestions([]);
    if (updated.length > 0) {
      setPdfMainTopic(cleanFileNameToTitle(updated.map((f) => f.name)));
    } else {
      setPdfMainTopic('');
      setStatus('idle');
    }
  };

  const handleClearAll = () => {
    setFiles([]);
    setExtractedData(null);
    setPdfAnalysis(null);
    setPdfMainTopic('');
    setSelectedPdfTopic('all');
    setCustomSubtopic('');
    setGeneratedQuestions([]);
    setValidationErrors([]);
    setStatus('idle');
    setStatusMessage('');
  };

  const computeFinalTopicTitle = (): string => {
    const baseTopic =
      pdfMainTopic.trim() ||
      (files.length > 0 ? cleanFileNameToTitle(files.map((f) => f.name)) : 'Study Notes');

    if (selectedPdfTopic === 'custom' && customSubtopic.trim()) {
      return `${baseTopic}: ${customSubtopic.trim()}`;
    }
    if (selectedPdfTopic !== 'all' && pdfAnalysis) {
      const match = pdfAnalysis.detectedTopics.find((t) => t.id === selectedPdfTopic);
      if (match) {
        return `${baseTopic} - ${match.title}`;
      }
    }
    return baseTopic;
  };

  const handleProcessPdf = async () => {
    if (files.length === 0) return;

    setStatus('extracting');
    setCurrentStep(1);
    setProgressPercent(5);
    setStatusMessage(`Starting stream extraction across ${files.length} PDF(s)...`);

    try {
      // 1. Efficient streaming text extraction and OCR across all files
      let extraction = extractedData;
      if (!extraction || !extraction.text || extraction.totalFiles !== files.length) {
        extraction = await extractTextFromMultiplePdfs(files, (p: ProgressInfo) => {
          setProgressPercent(p.percent);
          setStatusMessage(p.message);
        });
        setExtractedData(extraction);
      }

      if (!extraction.text || extraction.text.trim().length < 40) {
        setStatus('error');
        setStatusMessage(
          'Could not extract text from the uploaded PDF(s). If these are scanned documents, ensure pages have visible lighting or text.'
        );
        return;
      }

      // 2. Optional backup to Supabase Storage (bypasses gracefully if quota / unconfigured)
      if (isSupabaseConfigured() && user) {
        try {
          setStatus('uploading');
          setStatusMessage('Backing up PDF(s) to secure cloud notes vault...');
          for (const f of files) {
            // Only upload to cloud if under 50 MB to prevent bucket size limits on free tier
            if (f.size <= 50 * 1024 * 1024) {
              const storagePath = `${user.id}/${Date.now()}_${f.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
              const { error: uploadErr } = await supabase.storage.from('notes').upload(storagePath, f);
              if (!uploadErr) {
                await supabase.from('notes').insert({
                  user_id: user.id,
                  title: f.name,
                  storage_path: storagePath,
                });
              }
            }
          }
        } catch (storageErr) {
          console.warn('Supabase storage backup notice (continuing locally):', storageErr);
        }
      }

      // 3. Determine the topic created directly from this PDF content
      const finalTopicTitle = computeFinalTopicTitle();

      const createdTopic: Topic = {
        id: safeUUID(),
        unit_id: 'unit-pdf-notes',
        title: finalTopicTitle,
        order_index: 0,
      };
      await saveCustomTopic(createdTopic);

      // 4. Synthesize Conceptual Questions via Gemini 3.5 Flash / Grok
      setStatus('generating');
      setCurrentStep(2);
      setProgressPercent(60);
      setStatusMessage(`Synthesizing ${questionCount} conceptual MCQs for "${finalTopicTitle}"...`);

      const chosenChunk = extraction.chunks[0] || extraction.text.slice(0, 15000);
      let questionsRaw: Question[] = [];

      // Try Edge Function if configured
      let edgeSucceeded = false;
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.functions.invoke('generate-questions', {
            body: {
              text: chosenChunk,
              topicId: createdTopic.id,
              count: questionCount,
              difficulty,
            },
          });

          if (!error && data?.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            questionsRaw = data.questions;
            edgeSucceeded = true;
          }
        } catch (edgeErr) {
          console.warn('Edge Function fallback to client-side synthesizer:', edgeErr);
        }
      }

      // High-grade Gemini 3.5 Flash & Grok direct synthesizer
      if (!edgeSucceeded || questionsRaw.length === 0) {
        setStatusMessage(
          `Generating ${questionCount} ${difficulty.toUpperCase()} questions grounded in your notes...`
        );
        questionsRaw = await generateQuestionsFromNotes({
          text: chosenChunk,
          topicId: createdTopic.id,
          topicTitle: finalTopicTitle,
          count: questionCount,
          difficulty,
        });
      }

      // Link generated questions to the newly created PDF topic
      const finalQuestions = questionsRaw.map((q) => ({
        ...q,
        topic_id: createdTopic.id,
      }));

      // 5. Save Questions
      setStatus('saving');
      setCurrentStep(3);
      setProgressPercent(95);
      setStatusMessage('Finalizing quiz and saving to your vault...');
      await saveGeneratedQuestions(finalQuestions);

      setGeneratedQuestions(finalQuestions);
      setStatus('ready');
      setProgressPercent(100);
      setStatusMessage(`Successfully generated ${finalQuestions.length} MCQs from your PDF notes!`);

      if (autoStart) {
        onStartQuiz(createdTopic.id, createdTopic.title, finalQuestions);
      }
    } catch (err: any) {
      console.error('PDF process error:', err);
      setStatus('error');
      setStatusMessage(err?.message || 'Failed to process PDF documents.');
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
    const finalTopicTitle = computeFinalTopicTitle();
    const topicId = generatedQuestions[0]?.topic_id || 'notes-quiz';
    onStartQuiz(topicId, finalTopicTitle, generatedQuestions);
  };

  const totalBytesSelected = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/80 border border-indigo-100/90 shadow-[0_8px_24px_rgba(79,70,229,0.06)] p-6 sm:p-9 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-indigo-700 mb-3 border border-indigo-100 shadow-xs">
            <SugarySparkles size={18} />
            <span>AI Syllabus & Notes Synthesizer</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
            Notes-to-Quiz AI
          </h1>
          <p className="mt-2 text-xs sm:text-base text-slate-600 leading-relaxed font-medium">
            Upload single or multi-page textbooks, lecture slides, and scanned handouts. Supports large documents up to{' '}
            <span className="font-bold text-indigo-700">{MAX_PDF_SIZE_MB} MB</span> with built-in OCR.
          </p>
        </div>
      </div>

      {/* Main Upload Card */}
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
              {files.length > 0 ? (
                <FileText className="w-8 h-8 text-indigo-600" />
              ) : (
                <SugaryBook size={38} />
              )}
            </div>

            <span className="text-base sm:text-lg font-bold text-slate-900 text-center">
              {files.length > 0
                ? `${files.length} PDF Document${files.length > 1 ? 's' : ''} Selected`
                : 'Choose PDF documents or drag & drop here'}
            </span>
            <span className="text-xs text-slate-500 mt-1 text-center max-w-md">
              Lecture slides, multi-chapter textbooks, or scanned notes (up to {MAX_PDF_SIZE_MB} MB per file · multiple files supported)
            </span>

            <input
              id="pdf-upload"
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Validation Errors Alert */}
        {validationErrors.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1 text-xs font-semibold">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Some files could not be added:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Uploaded Files Queue List */}
        {files.length > 0 && (
          <div className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>
                  {files.length} Document{files.length > 1 ? 's' : ''} ({formatFileSize(totalBytesSelected)})
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  · Max {MAX_PDF_SIZE_MB} MB each
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label
                  htmlFor="pdf-upload-more"
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More</span>
                  <input
                    id="pdf-upload-more"
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-bold text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* List of Files */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {files.map((f, idx) => (
                <div
                  key={`${f.name}_${idx}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate max-w-xs sm:max-w-md">
                        {f.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {formatFileSize(f.size)} · PDF
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* OCR Notice if scanned PDFs detected */}
            {extractedData?.ocrApplied && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>AI OCR active: Transcribed text from scanned diagrams and photocopy pages.</span>
              </div>
            )}

            {/* Topic & Parameters Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* 1. Target Topic Created From PDF */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Target Topic (From PDF)
                  </label>
                  {analyzingTopics && (
                    <span className="text-[11px] font-bold text-indigo-600 animate-pulse flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                      Scanning topics...
                    </span>
                  )}
                </div>

                {/* Primary Topic detected from PDF (Editable) */}
                <div className="relative">
                  <input
                    type="text"
                    value={pdfMainTopic}
                    onChange={(e) => setPdfMainTopic(e.target.value)}
                    placeholder="Topic name extracted from PDF..."
                    className="w-full text-xs font-bold p-2.5 pr-20 rounded-xl border border-indigo-200 bg-indigo-50/50 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs transition-colors"
                  />
                  <span className="absolute right-2 top-2 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200 shadow-xs pointer-events-none">
                    PDF Topic
                  </span>
                </div>

                {/* Subtopic Focus Selector extracted from PDF */}
                {pdfAnalysis && pdfAnalysis.detectedTopics.length > 0 && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500">
                      Focus Area inside PDF:
                    </label>
                    <select
                      value={selectedPdfTopic}
                      onChange={(e) => setSelectedPdfTopic(e.target.value)}
                      className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                    >
                      <option value="all">🌟 All Topics Combined (Comprehensive)</option>
                      {pdfAnalysis.detectedTopics.map((st) => (
                        <option key={st.id} value={st.id}>
                          📑 {st.title}
                        </option>
                      ))}
                      <option value="custom">✏️ Custom Subtopic Focus...</option>
                    </select>

                    {selectedPdfTopic === 'custom' && (
                      <input
                        type="text"
                        value={customSubtopic}
                        onChange={(e) => setCustomSubtopic(e.target.value)}
                        placeholder="Enter specific topic/concept from PDF..."
                        className="mt-1.5 w-full text-xs p-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    )}
                  </div>
                )}

                <span className="block text-[11px] text-slate-500 font-medium">
                  {pdfAnalysis && pdfAnalysis.detectedTopics.length > 0
                    ? `Found ${pdfAnalysis.detectedTopics.length} core concepts in these PDF notes`
                    : 'Auto-detected directly from your uploaded PDF content'}
                </span>
              </div>

              {/* 2. Number of Questions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Question Count
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 15, 20].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        questionCount === cnt
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
                <span className="block text-[11px] text-slate-500 font-medium mt-1">
                  Generates {questionCount} multiple-choice questions
                </span>
              </div>

              {/* 3. Difficulty */}
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
                      onClick={() => setDifficulty(lvl)}
                      className={`py-2 text-xs font-bold rounded-xl border capitalize transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        difficulty === lvl
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <span className="block text-[11px] text-slate-500 font-medium mt-1">
                  {difficulty === 'easy' && 'Focuses on direct definitions & key facts'}
                  {difficulty === 'medium' && 'Tests core concepts & practical scenarios'}
                  {difficulty === 'hard' && 'Advanced multi-step reasoning & edge cases'}
                </span>
              </div>
            </div>

            {/* Auto Launch and Concealed Answers Guarantee */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800 select-none">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Start quiz directly after generation</span>
              </label>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Answers & explanations stay hidden until you solve each question</span>
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
                    ? 'Extracting PDF text & OCR...'
                    : status === 'generating'
                    ? `Generating ${questionCount} ${difficulty.toUpperCase()} MCQs...`
                    : autoStart
                    ? `Generate & Start Quiz (${questionCount} ${difficulty.toUpperCase()} MCQs)`
                    : `Generate ${questionCount} ${difficulty.toUpperCase()} MCQs from Notes`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Real-Time Processing Pipeline with Percentage Bar */}
        {(status === 'extracting' ||
          status === 'uploading' ||
          status === 'generating' ||
          status === 'saving') && (
          <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
              <span className="flex items-center gap-2 truncate max-w-md">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin shrink-0" />
                <span className="truncate">{statusMessage || 'Processing documents...'}</span>
              </span>
              <span className="font-mono text-indigo-700 shrink-0 font-black">
                {progressPercent}%
              </span>
            </div>

            {/* Percentage Bar */}
            <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-bold pt-1">
              <div
                className={`p-2 rounded-xl text-center transition-colors ${
                  currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                1. Stream & OCR
              </div>
              <div
                className={`p-2 rounded-xl text-center transition-colors ${
                  currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                2. AI Synthesis
              </div>
              <div
                className={`p-2 rounded-xl text-center transition-colors ${
                  currentStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                3. Save to Vault
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
                  Answers & explanations stay hidden here to test your mastery. Solve them in the quiz to see instant feedback!
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

          {/* Cards List (Neutral, answers concealed until solved) */}
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
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Question {qIdx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleFlagQuestion(q)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        q.flagged
                          ? 'border-amber-300 bg-amber-100 text-amber-700'
                          : 'border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-slate-50'
                      }`}
                      title="Flag question"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(qIdx)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug mb-4">
                  {q.question}
                </p>

                {/* Neutral Options Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {q.options.map((opt, optIdx) => {
                    const letters = ['A', 'B', 'C', 'D'];
                    return (
                      <div
                        key={optIdx}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs font-medium"
                      >
                        <span className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-[10px] text-slate-600 shrink-0">
                          {letters[optIdx]}
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Concealed Answer Notice */}
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 pt-1">
                  <Lock className="w-3 h-3" />
                  <span>Correct answer & comprehensive explanation will unlock during the quiz.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
