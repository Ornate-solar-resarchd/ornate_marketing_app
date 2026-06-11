"use client";

/**
 * ChatWidget — floating chatbot bubble + panel.
 *
 * Renders a small circle bottom-right of the viewport. Clicking opens a
 * slide-in panel where the user can ask questions. Streams answers from
 * the shared chatbot-api (POST /api/chat → text/event-stream).
 *
 * Configuration via env:
 *   NEXT_PUBLIC_CHATBOT_API_URL  — defaults to https://chat-api.unityess.cloud
 *
 * Brand follows CLAUDE.md §4 — orange #E8611A, dark #1A1A1A, rounded 10px.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

const CHATBOT_API_URL =
  process.env.NEXT_PUBLIC_CHATBOT_API_URL ?? "https://chat-api.unityess.cloud";

type ChatSource = {
  source: string;
  similarity: number;
  excerpt: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
  isStreaming?: boolean;
};

const SUGGESTED_QUERIES = [
  "BESS cell suppliers",
  "Show me inverter brands",
  "What's UnityESS?",
  "Solar panel partners",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom whenever a new message arrives or tokens stream in
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const send = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || streaming) return;
      setInput("");

      const userMsg: ChatMessage = {
        id: `u_${Date.now()}`,
        role: "user",
        text: trimmed,
      };
      const botMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: "assistant",
        text: "",
        isStreaming: true,
      };
      // Last 6 turns as history so follow-up questions resolve server-side.
      const history = messages
        .filter((m) => m.text)
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.text.slice(0, 2000) }));
      setMessages((prev) => [...prev, userMsg, botMsg]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${CHATBOT_API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: trimmed,
            portal: "marketing",
            k: 10,
            history,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Chat API returned HTTP ${res.status}`);
        }

        // Parse the SSE stream — events are separated by "\n\n"
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Each SSE event ends with \n\n; consume as many as we have
          let sepIdx: number;
          while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
            const rawEvent = buffer.slice(0, sepIdx);
            buffer = buffer.slice(sepIdx + 2);

            // Lines start with "data: " — strip and parse
            const line = rawEvent.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "sources") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsg.id ? { ...m, sources: event.sources } : m
                  )
                );
              } else if (event.type === "token") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsg.id ? { ...m, text: m.text + event.value } : m
                  )
                );
              } else if (event.type === "error") {
                throw new Error(event.error ?? "Stream error");
              }
            } catch (err) {
              // Malformed event — log and continue
              console.warn("[ChatWidget] bad SSE event:", line);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // user closed
        } else {
          const msg = err instanceof Error ? err.message : "Chat failed";
          toast.error(`Chatbot error: ${msg}`);
        }
      } finally {
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsg.id ? { ...m, isStreaming: false } : m))
        );
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming, messages]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const close = () => {
    abortRef.current?.abort();
    setOpen(false);
  };

  return (
    <>
      {/* Floating bubble — always visible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg ring-1 transition-all",
          "bg-[#E8611A] text-white ring-[#E8611A]/40 hover:scale-105 hover:bg-[#D55617] hover:shadow-xl",
          open && "scale-95 opacity-0 pointer-events-none"
        )}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
        </span>
      </button>

      {/* Slide-in panel */}
      <div
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-[calc(100vh-2.5rem)] max-h-[640px] w-[calc(100vw-2.5rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl transition-all duration-300",
          open
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1A1A1A] to-[#0f172a] px-4 py-3 text-white">
          <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-[#E8611A] opacity-30 blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8611A]/20 ring-1 ring-[#E8611A]/30">
                <Bot className="h-5 w-5 text-[#FF8A50]" />
              </div>
              <div>
                <div className="text-sm font-bold leading-tight">
                  Ornate Solar Assistant
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/60">
                  Powered by AI
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto bg-[#F4F5F7] px-3 py-4"
        >
          {messages.length === 0 ? (
            <Empty onPick={(q) => send(q)} />
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-[#E5E7EB] bg-white px-3 py-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about brands, products, datasheets…"
            disabled={streaming}
            className="flex h-10 flex-1 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#E8611A] focus:outline-none focus:ring-2 focus:ring-[#E8611A]/15"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8611A] text-white shadow-sm transition-all hover:bg-[#D55617] disabled:cursor-not-allowed disabled:bg-[#E8611A]/40"
            aria-label="Send"
          >
            {streaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function Empty({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF0E8]">
        <Sparkles className="h-6 w-6 text-[#E8611A]" />
      </div>
      <h3 className="text-sm font-bold text-[#1A1A1A]">
        How can I help you today?
      </h3>
      <p className="mt-1 max-w-[18rem] text-xs text-[#6B7280]">
        Ask about our brands, products, or any document in the catalog.
      </p>
      <div className="mt-5 flex w-full flex-col gap-2 px-3">
        {SUGGESTED_QUERIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-left text-xs font-medium text-[#1A1A1A] transition-colors hover:border-[#E8611A] hover:bg-[#FEF0E8] hover:text-[#E8611A]"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-[#E8611A] text-white"
            : "bg-white text-[#1A1A1A] shadow-sm ring-1 ring-[#E5E7EB]"
        )}
      >
        {message.text || (message.isStreaming ? <TypingDots /> : "")}
        {message.isStreaming && message.text && (
          <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-[#E8611A]" />
        )}
      </div>

      {message.sources && message.sources.length > 0 && !isUser && (
        <div className="ml-1 flex flex-wrap gap-1">
          {message.sources.slice(0, 3).map((s) => (
            <SourceChip key={s.source} source={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function SourceChip({ source }: { source: ChatSource }) {
  // Build a link back into the marketing portal if it's a brand chunk
  const m = source.source.match(/^marketing:(company|category|subcategory):(.+)$/);
  let href: string | undefined;
  let label = source.source;
  if (m) {
    const [, kind, slug] = m;
    label = slug;
    if (kind === "company") href = `/dashboard/oem-database/${slug}`;
    if (kind === "category") href = `/dashboard/${slug}`;
  }

  const inner = (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-2 py-0.5 text-[10px] font-medium text-[#6B7280] hover:border-[#E8611A] hover:text-[#E8611A]">
      <Sparkles className="h-2.5 w-2.5" />
      {label}
      <span className="text-[#9CA3AF]">· {Math.round(source.similarity * 100)}%</span>
    </span>
  );

  return href ? (
    <a href={href} className="cursor-pointer">
      {inner}
    </a>
  ) : (
    inner
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#9CA3AF] [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#9CA3AF] [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#9CA3AF] [animation-delay:300ms]" />
    </span>
  );
}
