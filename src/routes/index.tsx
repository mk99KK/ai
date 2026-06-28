import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Plus, Send, Trash2, MessageSquare, Loader2, ChevronDown, ChevronUp, Cpu, Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { AVAILABLE_MODELS, DEFAULT_MODEL_ID, type AIModel } from "@/lib/models";

export const Route = createFileRoute("/")({
  component: ChatPage,
});

type Thread = {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: number;
  modelId: string;
};

const generateUUID = () => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const newThread = (modelId = DEFAULT_MODEL_ID): Thread => ({
  id: generateUUID(),
  title: "محادثة جديدة",
  messages: [],
  createdAt: Date.now(),
  modelId,
});

function ChatPage() {
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
  const [threads, setThreads] = useState<Thread[]>(() => [newThread()]);
  const [activeId, setActiveId] = useState<string>(() => threads[0].id);

  const activeThread = threads.find((t) => t.id === activeId) ?? threads[0];

  // مزامنة محدد النموذج في القائمة الجانبية مع النموذج الخاص بالمحادثة النشطة حالياً
  useEffect(() => {
    if (activeThread) {
      setSelectedModelId(activeThread.modelId);
    }
  }, [activeId, activeThread?.modelId]);

  const handleCreate = () => {
    const t = newThread(selectedModelId);
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
  };

  const handleDelete = (id: string) => {
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        const t = newThread(selectedModelId);
        setActiveId(t.id);
        return [t];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    setThreads((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, modelId } : t)),
    );
  };

  const handleMessagesChange = (id: string, messages: UIMessage[]) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              messages,
              title:
                t.title === "محادثة جديدة" && messages[0]?.parts?.[0]
                  ? extractText(messages[0]).slice(0, 40) || t.title
                  : t.title,
            }
          : t,
      ),
    );
  };

  return (
    <div dir="rtl" className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-72 flex-col border-l border-border bg-muted/30 md:flex">
        <div className="p-3 space-y-2">
          {/* Model Selector */}
          <ModelSelector selectedId={selectedModelId} onChange={handleModelChange} />
          {/* New Thread Button */}
          <button
            onClick={handleCreate}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            محادثة جديدة
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <div className="space-y-1">
            {threads.map((t) => {
              const model = AVAILABLE_MODELS.find((m) => m.id === t.modelId);
              return (
                <div
                  key={t.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                    t.id === activeId
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(t.id)}
                    className="flex flex-1 items-center gap-2 truncate text-right"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                    <span className="flex-1 truncate">{t.title}</span>
                    {model && (
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary">
                        {model.name.split(" ").slice(-2).join(" ")}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="opacity-0 transition hover:text-destructive group-hover:opacity-100"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t border-border p-3 text-xs text-muted-foreground">
          المحادثات محفوظة مؤقتاً في الذاكرة فقط
        </div>
      </aside>

      {/* Chat */}
      <main className="flex flex-1 flex-col">
        <ChatWindow
          key={activeThread.id}
          thread={activeThread}
          onMessagesChange={(msgs) => handleMessagesChange(activeThread.id, msgs)}
        />
      </main>
    </div>
  );
}

// ─── Model Selector ──────────────────────────────────────────────────────────

function ModelSelector({
  selectedId,
  onChange,
}: {
  selectedId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === selectedId) ?? AVAILABLE_MODELS[0];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition hover:bg-accent"
      >
        <Cpu className="h-4 w-4 shrink-0 text-primary" />
        <span className="flex-1 truncate text-right font-medium">{selectedModel.name}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden max-h-[350px] overflow-y-auto">
          {AVAILABLE_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => { onChange(model.id); setOpen(false); }}
              className={cn(
                "flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-sm transition hover:bg-accent text-right",
                model.id === selectedId && "bg-accent",
              )}
            >
              <div className="flex w-full items-center gap-2">
                <span className="font-medium flex-1 text-right">{model.name}</span>
                {model.badge && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {model.badge}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground text-right">{model.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Chat Window ─────────────────────────────────────────────────────────────

function ChatWindow({
  thread,
  onMessagesChange,
}: {
  thread: Thread;
  onMessagesChange: (messages: UIMessage[]) => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { model: thread.modelId },
      }),
    [thread.modelId],
  );

  const { messages, sendMessage, status, error, regenerate } = useChat({
    id: thread.id,
    messages: thread.messages,
    transport,
  });

  useEffect(() => {
    onMessagesChange(messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [thread.id, status]);

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput("");
  };

  const currentModel = AVAILABLE_MODELS.find((m) => m.id === thread.modelId);

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <h1 className="text-sm font-medium">{thread.title}</h1>
        {currentModel && (
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Cpu className="h-3.5 w-3.5" />
            {currentModel.name}
          </span>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {messages.length === 0 ? (
            <EmptyState model={currentModel} />
          ) : (
            <div className="space-y-6">
              {messages.map((m, idx) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  modelName={currentModel?.name}
                  isLast={idx === messages.length - 1}
                  onRegenerate={regenerate}
                />
              ))}
              {status === "submitted" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التفكير...
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive flex items-center justify-between flex-row-reverse leading-relaxed">
                  <div className="text-right flex-1 text-wrap break-all">حدث خطأ: {error.message}</div>
                  <button
                    type="button"
                    onClick={() => regenerate()}
                    className="mr-3 flex items-center gap-1 bg-destructive text-destructive-foreground px-2.5 py-1.5 rounded-lg hover:opacity-90 text-xs font-medium shrink-0 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>إعادة المحاولة</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background p-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-muted/30 p-2 focus-within:border-primary/50"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
            placeholder="اكتب رسالتك هنا..."
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground text-right"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4 -scale-x-100" />
            )}
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
          اضغط Enter للإرسال · Shift+Enter لسطر جديد
        </p>
      </div>
    </>
  );
}

// ─── Tool Invocations Display ────────────────────────────────────────────────

function ToolInvocationsDisplay({ toolInvocations }: { toolInvocations?: any[] }) {
  const [showDocs, setShowDocs] = useState<Record<string, boolean>>({});

  if (!toolInvocations || toolInvocations.length === 0) return null;

  return (
    <div className="my-2 space-y-2 text-right">
      {toolInvocations.map((ti) => {
        if (ti.toolName === "search_in_rag_database") {
          const isCall = ti.state === "call";
          const isResult = ti.state === "result";
          const resultText = ti.result;
          const query = ti.args?.query;

          return (
            <div key={ti.toolCallId} className="rounded-xl border border-border bg-card/60 p-3 text-xs leading-relaxed">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="flex items-center gap-2 font-medium">
                  {isCall ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <Search className="h-3.5 w-3.5 text-green-500" />
                  )}
                  <span>أداة البحث في المستندات (RAG)</span>
                </div>
                {isResult && resultText && (
                  <button
                    type="button"
                    onClick={() => setShowDocs((prev) => ({ ...prev, [ti.toolCallId]: !prev[ti.toolCallId] }))}
                    className="flex items-center gap-1 text-primary hover:underline font-medium text-[11px]"
                  >
                    <span>{showDocs[ti.toolCallId] ? "إخفاء التفاصيل" : "عرض المستندات المسترجعة"}</span>
                    {showDocs[ti.toolCallId] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
              </div>

              <div className="mt-1 text-muted-foreground text-right">
                سؤال البحث: <span className="font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded">{query}</span>
              </div>

              {isResult && showDocs[ti.toolCallId] && resultText && (
                <div className="mt-2.5 max-h-48 overflow-y-auto rounded-lg border border-border bg-background p-2.5 font-mono text-[11px] leading-relaxed text-right text-muted-foreground">
                  {resultText}
                </div>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  modelName,
  isLast,
  onRegenerate,
}: {
  message: UIMessage;
  modelName?: string;
  isLast?: boolean;
  onRegenerate?: () => void;
}) {
  const isUser = message.role === "user";
  const text = extractText(message);

  return (
    <div className="space-y-1 text-right">
      <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isUser ? "أنت" : "AI"}
        </div>
        <div
          className={cn(
            "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-right relative group",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {/* عرض تفاصيل الأداة والـ RAG إذا كانت مستدعاة */}
          {!isUser && message.toolInvocations && message.toolInvocations.length > 0 && (
            <ToolInvocationsDisplay toolInvocations={message.toolInvocations} />
          )}

          <div className="whitespace-pre-wrap">{text}</div>

          {/* تفاصيل الموديل النشط وأزرار التحكم أسفل فقاعة الرد */}
          {!isUser && (modelName || (isLast && onRegenerate)) && (
            <div className="mt-2 flex items-center justify-between flex-row-reverse text-[10px] text-muted-foreground">
              {modelName && (
                <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                  توليد بواسطة: {modelName}
                </span>
              )}
              {isLast && onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="flex items-center gap-1 hover:text-primary transition-colors font-medium opacity-50 group-hover:opacity-100"
                  title="محاولة أخرى وإعادة توليد الرد"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>محاولة أخرى</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ model }: { model?: AIModel }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <MessageSquare className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-xl font-semibold">كيف يمكنني مساعدتك؟</h2>
      {model && (
        <p className="mt-1 text-xs text-muted-foreground">
          تحدث الآن مع <span className="font-medium text-primary">{model.name}</span>
        </p>
      )}
      <p className="mt-2 text-sm text-muted-foreground">
        ابدأ المحادثة بكتابة رسالتك في الأسفل
      </p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractText(m: UIMessage): string {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
}
