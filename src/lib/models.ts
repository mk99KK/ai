/**
 * قائمة النماذج المتاحة للاستخدام
 * كل نموذج يحمل إعدادات المزود الخاص به
 */

export type ProviderConfig = {
  baseURL: string;
  apiKey: string; // يُقرأ من .env، أو نص ثابت للمزودين المحليين
};

export type AIModel = {
  id: string;         // المعرّف الذي يُرسَل للـ API
  name: string;       // الاسم المعروض في الواجهة
  description: string;
  badge?: string;
  provider: ProviderConfig;
  supportsTools?: boolean; // هل يدعم الـ Tool Calling
};

// ─── OpenRouter ──────────────────────────────────────────────────────────────
const openRouterProvider: ProviderConfig = {
  baseURL: process.env.CUSTOM_API_BASE_URL ?? "https://openrouter.ai/api/v1",
  apiKey: process.env.CUSTOM_API_KEY ?? "",
};

// ─── Ollama (VPS) ─────────────────────────────────────────────────────────────
const ollamaProvider: ProviderConfig = {
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  apiKey: "ollama",
};

// ─── OpenAI Direct ───────────────────────────────────────────────────────────
const openAIDirectProvider: ProviderConfig = {
  baseURL: "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY ?? "",
};

// ─── Gemini Direct (OpenAI-compatible) ───────────────────────────────────────
const geminiDirectProvider: ProviderConfig = {
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
  apiKey: process.env.GEMINI_API_KEY ?? "",
};

export const AVAILABLE_MODELS: AIModel[] = [

  // ─── نماذج Gemini المباشرة (الافتراضي) ───────────────────────────────────────
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash (Direct) ⭐",
    description: "نموذج Google فائق السرعة مباشرة — الافتراضي الموصى به",
    badge: "موصى به",
    provider: geminiDirectProvider,
    supportsTools: true,
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash (Direct) 🆕",
    description: "أحدث وأقوى موديل من Google مباشرة عبر API الخاص بك",
    badge: "أحدث",
    provider: geminiDirectProvider,
    supportsTools: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro (Direct)",
    description: "نموذج Google الأعلى دقة مباشرة عبر API الخاص بك",
    badge: "مميز",
    provider: geminiDirectProvider,
    supportsTools: true,
  },

  // ─── نماذج OpenAI المباشرة ───────────────────────────────────────────────────
  {
    id: "gpt-4o",
    name: "GPT-4o (Direct)",
    description: "نموذج OpenAI الأقوى مباشرة عبر API الخاص بك",
    badge: "قوي",
    provider: openAIDirectProvider,
    supportsTools: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini (Direct)",
    description: "نموذج OpenAI السريع والاقتصادي مباشرة",
    provider: openAIDirectProvider,
    supportsTools: true,
  },

  // ─── نماذج Ollama Cloud (VPS) ─────────────────────────────────────────────
  {
    id: "qwen3.5:397b-cloud",
    name: "Qwen 3.5 397B Cloud ☁️",
    description: "أقوى موديلات Qwen السحابية على خادم الـ VPS",
    badge: "عملاق",
    provider: ollamaProvider,
    supportsTools: false,
  },
  {
    id: "deepseek-v4-pro:cloud",
    name: "DeepSeek V4 Pro Cloud ☁️",
    description: "نموذج DeepSeek الأحدث والأقوى على خادم الـ VPS",
    badge: "برو",
    provider: ollamaProvider,
    supportsTools: false,
  },
  {
    id: "gemma4:31b-cloud",
    name: "Gemma 4 31B Cloud ☁️",
    description: "نموذج Google Gemma 4 متعدد المهام على خادم الـ VPS",
    badge: "متعدد المهام",
    provider: ollamaProvider,
    supportsTools: false,
  },
  {
    id: "glm-5.1:cloud",
    name: "GLM 5.1 Cloud ☁️",
    description: "نموذج GLM السحابي المتطور على خادم الـ VPS",
    badge: "حديث",
    provider: ollamaProvider,
    supportsTools: false,
  },
  {
    id: "gpt-oss:120b-cloud",
    name: "GPT-OSS 120B Cloud ☁️",
    description: "نموذج Microsoft GPT مفتوح المصدر بحجم 120B على خادم الـ VPS",
    badge: "ضخم",
    provider: ollamaProvider,
    supportsTools: false,
  },
  {
    id: "gemini-3-flash-preview:cloud",
    name: "Gemini 3 Flash Preview Cloud ☁️",
    description: "أحدث إصدار تجريبي من Google Gemini 3 على خادم الـ VPS",
    badge: "تجريبي",
    provider: ollamaProvider,
    supportsTools: false,
  },

  // ─── نماذج Ollama المحلية (VPS) ───────────────────────────────────────────
  {
    id: "harvykj30/Llama_mukaa:latest",
    name: "Llama Mukaa (مخصص) 🦙",
    description: "نموذج Llama 3.2 المخصص الخاص بك على خادم الـ VPS",
    badge: "خاص",
    provider: ollamaProvider,
    supportsTools: false,
  },
  {
    id: "qwen3.5:4b",
    name: "Qwen 3.5 4B (VPS)",
    description: "نموذج Qwen 3.5 خفيف وسريع مع دعم التفكير والرؤية",
    provider: ollamaProvider,
    supportsTools: false,
  },
  {
    id: "llama3.2:latest",
    name: "Llama 3.2 3B (VPS)",
    description: "نموذج Meta Llama الخفيف والسريع على خادم الـ VPS",
    provider: ollamaProvider,
    supportsTools: false,
  },
  {
    id: "qwen2.5:1.5b",
    name: "Qwen 2.5 1.5B (VPS)",
    description: "نموذج Qwen الأخف وزناً للمهام البسيطة والسريعة",
    provider: ollamaProvider,
    supportsTools: false,
  },
  {
    id: "gemma3:4b",
    name: "Gemma 3 4B (VPS)",
    description: "نموذج Google Gemma 3 الخفيف على خادم الـ VPS",
    provider: ollamaProvider,
    supportsTools: false, // لا يدعم Tools
  },

  // ─── نماذج OpenRouter ────────────────────────────────────────────────────────
  {
    id: "openai/gpt-4o",
    name: "GPT-4o (OpenRouter)",
    description: "نموذج OpenAI الأقوى والأحدث عبر OpenRouter",
    provider: openRouterProvider,
    supportsTools: true,
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini (OpenRouter)",
    description: "نموذج OpenAI ذكي وسريع واقتصادي عبر OpenRouter",
    provider: openRouterProvider,
    supportsTools: true,
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash (OpenRouter)",
    description: "نموذج Google فائق السرعة عبر OpenRouter",
    provider: openRouterProvider,
    supportsTools: true,
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro (OpenRouter)",
    description: "نموذج Google الأعلى دقة عبر OpenRouter",
    provider: openRouterProvider,
    supportsTools: true,
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3 (OpenRouter)",
    description: "النموذج الصيني المتطور ذو الكفاءة العالية",
    provider: openRouterProvider,
    supportsTools: true,
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B (OpenRouter)",
    description: "أقوى نموذج مفتوح المصدر من Meta عبر OpenRouter",
    provider: openRouterProvider,
    supportsTools: true,
  },
  {
    id: "meta-llama/llama-3.2-3b-instruct:free",
    name: "Llama 3.2 3B Free (OpenRouter)",
    description: "نسخة مجانية بالكامل من Llama الخفيف",
    badge: "مجاني",
    provider: openRouterProvider,
    supportsTools: true,
  },
];

export const DEFAULT_MODEL_ID = AVAILABLE_MODELS[0].id;
