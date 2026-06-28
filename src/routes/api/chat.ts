import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { aiConfig } from "@/lib/ai-config";
import { AVAILABLE_MODELS, DEFAULT_MODEL_ID } from "@/lib/models";

// دالة لتوليد الـ Embeddings باستخدام OpenAI أو OpenRouter
async function getEmbedding(query: string, apiKey: string): Promise<number[]> {
  const openaiApiKey =
    process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "YOUR_OPENAI_API_KEY"
      ? process.env.OPENAI_API_KEY
      : apiKey;

  if (!openaiApiKey || openaiApiKey === "ollama") {
    throw new Error("توليد الـ embeddings يتطلب مفتاح API لـ OpenAI أو OpenRouter صالح.");
  }

  const isOpenRouter = openaiApiKey.startsWith("sk-or-");
  const url = isOpenRouter
    ? "https://openrouter.ai/api/v1/embeddings"
    : "https://api.openai.com/v1/embeddings";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: query,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`خطأ أثناء توليد الـ embedding: ${response.statusText} - ${errText}`);
  }

  const result = await response.json();
  if (!result.data || !result.data[0] || !result.data[0].embedding) {
    throw new Error("تنسيق رد الـ Embedding غير صالح من المزود.");
  }

  return result.data[0].embedding;
}

// دالة للبحث في قاعدة بيانات Supabase باستخدام RPC
async function searchInSupabase(queryEmbedding: number[], filterModel: string): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL || "https://your-project.supabase.co";
  const supabaseKey = process.env.SUPABASE_KEY || "your-supabase-anon-key";

  if (
    supabaseUrl.includes("your-project") ||
    supabaseKey === "your-supabase-anon-key"
  ) {
    console.warn("تنبيه: لم يتم تكوين بيانات Supabase بشكل صحيح في ملف .env");
    return "تنبيه: لم يتم إعداد قاعدة بيانات Supabase بشكل صحيح في ملف الإعدادات (.env).";
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/match_document_sections`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 3,
      filter_model: filterModel,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`خطأ أثناء البحث في Supabase: ${response.statusText} - ${errText}`);
  }

  const retrievedDocs = (await response.json()) as Array<{ content: string }>;
  if (!retrievedDocs || retrievedDocs.length === 0) {
    return "لم يتم العثور على أي معلومات متعلقة بهذا السؤال في الملفات المرفوعة.";
  }

  return retrievedDocs.map((doc) => doc.content).join("\n");
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages, model: requestedModel } = (await request.json()) as {
            messages: UIMessage[];
            model?: string;
          };

          // التحقق من أن النموذج المطلوب موجود في القائمة المسموح بها
          const allowedIds = AVAILABLE_MODELS.map((m) => m.id);
          const modelId =
            requestedModel && allowedIds.includes(requestedModel)
              ? requestedModel
              : DEFAULT_MODEL_ID;

          const selectedModel = AVAILABLE_MODELS.find((m) => m.id === modelId);
          const baseURL = selectedModel?.provider.baseURL ?? aiConfig.baseURL;

          let apiKey = selectedModel?.provider.apiKey ?? aiConfig.apiKey;

          // التحقق مما إذا كان العنوان محلياً بالكامل (Ollama محلي)
          const isLocalOllama =
            baseURL.includes("localhost") ||
            baseURL.includes("127.0.0.1") ||
            baseURL.includes("host.docker.internal");

          // Ollama VPS أو محلي — نحدده بالـ apiKey أو الـ baseURL
          const isOllamaModel =
            isLocalOllama ||
            apiKey === "ollama" ||
            baseURL.includes("11434");

          // إذا كان المفتاح افتراضياً لـ Ollama ولكن العنوان خارجي (مثل VPS)، نستخدم مفتاح الـ VPS
          if (apiKey === "ollama" && !isLocalOllama && aiConfig.apiKey) {
            apiKey = aiConfig.apiKey;
          }

          // تحديد ما إذا كان الاتصال لا يتطلب مفتاح API
          const noKeyRequired = isLocalOllama || (apiKey === "ollama");

          if (!noKeyRequired && !apiKey) {
            return new Response(
              JSON.stringify({
                error:
                  "لم يتم إعداد CUSTOM_API_KEY. أضفه في ملف .env في جذر المشروع.",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }

          const headers: Record<string, string> = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
          if (baseURL.includes("openrouter.ai")) {
            headers["HTTP-Referer"] = "https://lovable.dev";
            headers["X-Title"] = "AI Marketing App";
          }
          if (baseURL.includes("ngrok")) {
            headers["ngrok-skip-browser-warning"] = "true";
          }

          const provider = createOpenAICompatible({
            name: "custom",
            baseURL: baseURL,
            headers: headers,
          });

          // تحديد سياق الموديل الحالي لاستخدامه في فلترة مستندات Supabase
          const currentModelContext = isOllamaModel ? "ollama" : "openai";

          // قراءة دعم الأدوات مباشرة من تعريف الموديل
          const supportsTools = selectedModel?.supportsTools ?? !isOllamaModel;

          const systemPrompt = supportsTools
            ? `${aiConfig.systemPrompt}\nأنت مساعد ذكي وخبير (AI Agent). لديك الصلاحية لاستخدام أداة البحث في قاعدة البيانات (search_in_rag_database) إذا طلب المستخدم معلومات خاصة، سياسات، ملفات مرفوعة، أو أي بيانات ليست عندك في تدريبك العام. إذا كان السؤال عاماً، أجب مباشرة من معلوماتك دون استخدام الأداة.`
            : aiConfig.systemPrompt;

          const result = streamText({
            model: provider(modelId),
            system: systemPrompt,
            messages: await convertToModelMessages(messages),
            // تفعيل الأدوات فقط للموديلات السحابية التي تدعم Tool Calling
            ...(supportsTools && {
              maxSteps: 5,
              tools: {
                search_in_rag_database: tool({
                  description:
                    "ابحث في هذه الأداة عندما يسألك المستخدم عن معلومات خاصة، سياسات، ملفات مرفوعة، أو أي بيانات ليست عندك في تدريبك العام.",
                  parameters: z.object({
                    query: z.string().describe("سؤال البحث أو الكلمات المفتاحية للبحث عنها في قاعدة البيانات"),
                  }),
                  execute: async ({ query }) => {
                    try {
                      const queryEmbedding = await getEmbedding(query, apiKey);
                      const searchResults = await searchInSupabase(queryEmbedding, currentModelContext);
                      return searchResults;
                    } catch (error: any) {
                      console.error("خطأ في أداة البحث:", error);
                      return `حدث خطأ أثناء محاولة البحث: ${error.message}`;
                    }
                  },
                }),
              },
            }),
          });

          return result.toUIMessageStreamResponse({ originalMessages: messages });
        } catch (error: any) {
          console.error("خطأ في الـ Chat API:", error);
          return new Response(
            JSON.stringify({ error: error.message ?? "حدث خطأ غير متوقع." }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
