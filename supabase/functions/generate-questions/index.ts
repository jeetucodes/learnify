import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod item schema
const QuestionItemSchema = z.object({
  question: z.string().min(5),
  options: z.array(z.string().min(1)).length(4).refine(
    (arr) => new Set(arr.map((s) => s.trim().toLowerCase())).size === 4,
    { message: "Options must be 4 distinct choices" }
  ),
  answer_index: z.number().int().min(0).max(3),
  explanation: z.string().min(5),
  source_passage: z.string().optional().default(""),
});

// Helper for SHA-256 hash
async function sha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // 1. CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing: Supabase credentials not set." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Authentication: Require valid user JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required. Please sign in to generate questions." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session. Please sign in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.user;

    // 3. Parse and Validate Request Payload
    const body = await req.json().catch(() => ({}));
    const { text, topicId, count = 10, difficulty = "medium" } = body;

    if (!text || typeof text !== "string" || text.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Study notes text must contain at least 50 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit text input to 25,000 chars and count to 5-15
    const sanitizedText = text.slice(0, 25000);
    const targetCount = Math.min(15, Math.max(5, Number(count) || 10));

    // 4. Rate Limiting: Max 10 requests per user per hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count: recentCount, error: countErr } = await adminClient
      .from("generation_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    if (!countErr && typeof recentCount === "number" && recentCount >= 10) {
      return new Response(
        JSON.stringify({
          error: "Rate limit reached. You can generate questions up to 10 times per hour. Please review saved questions or try again later.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Cache Lookup: SHA-256 of text + count
    const cacheKey = await sha256(`${sanitizedText.trim()}_count_${targetCount}`);
    const { data: cachedRow } = await adminClient
      .from("generation_cache")
      .select("questions")
      .eq("hash", cacheKey)
      .single();

    if (cachedRow?.questions && Array.isArray(cachedRow.questions) && cachedRow.questions.length >= targetCount) {
      return new Response(
        JSON.stringify({
          questions: cachedRow.questions,
          cached: true,
          count: cachedRow.questions.length,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Build Strict Prompt (Forbid outside facts, enforce JSON schema)
    const systemPrompt = `You are an expert academic university exam creator.
Create exactly ${targetCount} high-quality Multiple Choice Questions (MCQs) strictly from the provided text.
Difficulty level: ${difficulty}.

STRICT RULES:
1. ONLY create questions whose factual answers are directly mentioned in the provided text.
2. DO NOT hallucinate, infer outside facts, or bring in external knowledge.
3. Every question must include a "source_passage" containing an exact quote or near-quote from the text where the answer is found.
4. Each question must have:
   - "question": Clear, direct conceptual exam question.
   - "options": An array of exactly 4 plausible, distinct choices.
   - "answer_index": Integer (0, 1, 2, or 3) indicating the single correct choice in "options".
   - "explanation": Concise, high-yield explanation stating why the correct option is right.
   - "source_passage": Quoted passage from the text supporting this answer.

Respond strictly with valid JSON conforming to this schema with NO markdown code fences or backticks:
{
  "questions": [
    {
      "question": "...",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "answer_index": 0,
      "explanation": "...",
      "source_passage": "..."
    }
  ]
}`;

    const userPrompt = `Source Study Notes:\n\n${sanitizedText}\n\nGenerate exactly ${targetCount} MCQs strictly conforming to the JSON schema now.`;

    let generatedItems: any[] = [];
    let providerUsed = "none";

    // 7. Provider 1: Gemini API
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const geminiModel = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";

    if (geminiKey) {
      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;
        let res = await fetch(geminiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.2,
            },
          }),
        });

        // Retry with backoff if rate limited (429)
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 1200));
          res = await fetch(geminiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
              generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.2,
              },
            }),
          });
        }

        if (res.ok) {
          const geminiData = await res.json();
          const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsedJson = JSON.parse(candidateText);
            if (Array.isArray(parsedJson.questions)) {
              generatedItems = parsedJson.questions;
              providerUsed = "gemini";
            }
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini call exception, attempting fallback:", geminiErr);
      }
    }

    // 8. Provider 2: Groq Fallback
    if (generatedItems.length === 0) {
      const groqKey = Deno.env.get("GROQ_API_KEY");
      const groqModel = Deno.env.get("GROQ_MODEL") || "llama-3.3-70b-versatile";

      if (groqKey) {
        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: groqModel,
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
            const content = groqData.choices?.[0]?.message?.content;
            if (content) {
              const parsedJson = JSON.parse(content);
              if (Array.isArray(parsedJson.questions)) {
                generatedItems = parsedJson.questions;
                providerUsed = "groq";
              }
            }
          }
        } catch (groqErr) {
          console.warn("Groq call exception:", groqErr);
        }
      }
    }

    if (generatedItems.length === 0) {
      return new Response(
        JSON.stringify({
          error: "AI generation services are currently unavailable or busy. Please check secrets or try again in a few moments.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 9. Zod Item Validation & Filtering
    const validatedQuestions: any[] = [];
    for (const item of generatedItems) {
      const parseResult = QuestionItemSchema.safeParse(item);
      if (parseResult.success) {
        validatedQuestions.push(parseResult.data);
      }
    }

    let warningMessage: string | undefined;
    if (validatedQuestions.length < targetCount) {
      warningMessage = `Generated ${validatedQuestions.length} of ${targetCount} requested questions due to text density.`;
    }

    if (validatedQuestions.length === 0) {
      return new Response(
        JSON.stringify({ error: "The provided notes text did not yield enough clear facts to formulate verifiable MCQs." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 10. Log Generation Request (for rate limiting)
    await adminClient.from("generation_log").insert({ user_id: user.id });

    // 11. Insert Questions into database table
    const questionsToInsert = validatedQuestions.map((q) => ({
      topic_id: topicId || null,
      question: q.question,
      options: q.options,
      answer_index: q.answer_index,
      explanation: q.explanation,
      source: "ai",
      source_passage: q.source_passage,
      created_by: user.id,
      flagged: false,
      content_hash: cacheKey,
    }));

    const { data: insertedQuestions, error: insertErr } = await adminClient
      .from("questions")
      .insert(questionsToInsert)
      .select();

    const returnedQuestions = (!insertErr && insertedQuestions) ? insertedQuestions : questionsToInsert;

    // 12. Save into generation_cache
    await adminClient.from("generation_cache").upsert({
      hash: cacheKey,
      questions: returnedQuestions,
    });

    return new Response(
      JSON.stringify({
        questions: returnedQuestions,
        cached: false,
        provider: providerUsed,
        count: returnedQuestions.length,
        warning: warningMessage,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Global edge error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred during question generation." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
