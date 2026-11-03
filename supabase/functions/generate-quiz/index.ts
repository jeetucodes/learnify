import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schema for generated questions
const QuestionSchema = z.object({
  question: z.string().min(5),
  options: z.array(z.string().min(1)).length(4),
  answer_index: z.number().int().min(0).max(3),
  explanation: z.string().min(5),
});

const GeneratedQuizSchema = z.object({
  questions: z.array(QuestionSchema).length(10),
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text, content_hash } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Text must be at least 20 characters long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    let supabase = null;

    if (supabaseUrl && supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    }

    // 1. Check cache by content_hash if hash is provided and Supabase is configured
    if (content_hash && supabase) {
      const { data: cachedQuestions, error: cacheErr } = await supabase
        .from("questions")
        .select("*")
        .eq("content_hash", content_hash)
        .limit(10);

      if (!cacheErr && cachedQuestions && cachedQuestions.length >= 5) {
        return new Response(
          JSON.stringify({ questions: cachedQuestions, cached: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const systemPrompt = `You are an expert exam question creator for university STEM and computer science subjects.
Generate exactly 10 high-quality multiple choice questions (MCQs) from the provided study notes.
Each question must have:
- "question": A clear, conceptual question testing knowledge or application.
- "options": An array of exactly 4 plausible answer options.
- "answer_index": An integer from 0 to 3 indicating the single correct option in the options array.
- "explanation": A detailed, educational explanation of why the correct option is right.

Respond strictly in valid JSON matching this structure with NO extra markdown formatting or backticks:
{
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "answer_index": 0,
      "explanation": "..."
    }
  ]
}`;

    const userPrompt = `Study Notes:\n\n${text.slice(0, 15000)}\n\nGenerate exactly 10 MCQs based on these notes now.`;

    let rawQuestionsJson: any = null;

    // 2. Try Gemini API first (Primary)
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (geminiApiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
                },
              ],
              generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.2,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            rawQuestionsJson = JSON.parse(candidateText);
          }
        } else {
          console.error("Gemini API error:", await geminiRes.text());
        }
      } catch (geminiErr) {
        console.error("Gemini call exception:", geminiErr);
      }
    }

    // 3. Fallback to Groq if Gemini failed or key not present
    if (!rawQuestionsJson) {
      const groqApiKey = Deno.env.get("GROQ_API_KEY");
      if (groqApiKey) {
        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              response_format: { type: "json_object" },
              temperature: 0.2,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
            }),
          });

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            const groqContent = groqData.choices?.[0]?.message?.content;
            if (groqContent) {
              rawQuestionsJson = JSON.parse(groqContent);
            }
          } else {
            console.error("Groq API error:", await groqRes.text());
          }
        } catch (groqErr) {
          console.error("Groq call exception:", groqErr);
        }
      }
    }

    if (!rawQuestionsJson) {
      throw new Error("Both Gemini and Groq providers failed or are unconfigured");
    }

    // 4. Validate output with Zod
    const parsed = GeneratedQuizSchema.parse(rawQuestionsJson);

    // 5. Save to Supabase questions table if client available
    const questionsToInsert = parsed.questions.map((q) => ({
      question: q.question,
      options: q.options,
      answer_index: q.answer_index,
      explanation: q.explanation,
      source: "ai",
      content_hash: content_hash || null,
      flagged: false,
    }));

    let savedQuestions = questionsToInsert;
    if (supabase) {
      const { data: inserted, error: insertErr } = await supabase
        .from("questions")
        .insert(questionsToInsert)
        .select();

      if (!insertErr && inserted) {
        savedQuestions = inserted;
      }
    }

    return new Response(
      JSON.stringify({ questions: savedQuestions, cached: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Handler error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Failed to generate quiz questions" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
