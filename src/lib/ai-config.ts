/**
 * ========================================
 *   إعدادات API الخاص بك - عدّل من هنا
 * ========================================
 *
 * ضع بيانات الـ API الخاص بك هنا (Llama, Ollama, OpenAI-compatible, إلخ)
 * المفتاح يُقرأ من ملف .env عشان ما ينكشف في المتصفح.
 *
 * في ملف .env (أنشئه في جذر المشروع) أضف:
 *   CUSTOM_API_KEY=ضع_مفتاحك_هنا
 *   CUSTOM_API_BASE_URL=https://your-endpoint.com/v1
 *   CUSTOM_API_MODEL=llama-3.1-70b
 */

export const aiConfig = {
  // عنوان الـ API (OpenAI-compatible). أمثلة:
  //   - Ollama:        http://localhost:11434/v1
  //   - Together AI:   https://api.together.xyz/v1
  //   - Groq:          https://api.groq.com/openai/v1
  //   - OpenAI:        https://api.openai.com/v1
  baseURL: process.env.CUSTOM_API_BASE_URL ?? "https://api.openai.com/v1",

  // المفتاح السري (server-side فقط)
  apiKey: process.env.CUSTOM_API_KEY ?? "",

  // اسم الموديل
  model: process.env.CUSTOM_API_MODEL ?? "gpt-4o-mini",

  // System prompt افتراضي
  systemPrompt: "أنت مساعد ذكي ومفيد. أجب باللغة العربية بشكل واضح ومختصر.",
};
