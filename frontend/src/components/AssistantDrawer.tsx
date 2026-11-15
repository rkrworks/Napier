"use client";

import { useEffect, useRef, useState, useId } from "react";
import { X, Send, Sparkles, Bot, User, ArrowRight, Loader2 } from "lucide-react";
import { sendAssistantChat, type ChatResponse } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  badge?: string;
  recommendation?: string;
}

interface AssistantDrawerProps {
  open: boolean;
  onClose: () => void;
  origin?: string;
  destination?: string;
  departureDate?: string;
}

const DEFAULT_SUGGESTIONS = [
  "Should I book today or wait until Friday?",
  "How much will prices surge around Diwali?",
  "Which carrier is offering the best price right now?",
];

export default function AssistantDrawer({
  open,
  onClose,
  origin = "DEL",
  destination = "BOM",
  departureDate,
}: AssistantDrawerProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I am NAPIER's Flight Telemetry AI. I analyze route price dispersion, holiday demand multipliers, and booking horizons for **${origin}-${destination}**. Ask me anything about fare timing or airline pricing!`,
      badge: "AI_TELEMETRY_READY",
    },
  ]);

  const drawerRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const formInputId = useId();

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus trap & Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const handleSend = async (textToSend?: string) => {
    const message = (textToSend || input).trim();
    if (!message || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);

    try {
      const res: ChatResponse = await sendAssistantChat({
        message,
        origin,
        destination,
        date: departureDate,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.markdown_advice,
          badge: res.status_badge,
          recommendation: res.recommendation,
        },
      ]);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "NAPIER AI service is currently unavailable. Please verify the backend connection.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Error communicating with assistant**: ${errorMessage}`,
          badge: "ASSISTANT_OFFLINE",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Slide-over Drawer with Strict inert & aria-hidden */}
      <aside
        ref={drawerRef}
        inert={!open ? true : undefined}
        aria-hidden={!open ? true : undefined}
        role="dialog"
        aria-modal="true"
        aria-label="NAPIER AI Assistant Drawer"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/70 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-slate-900 dark:text-white">
                NAPIER Copilot
              </h2>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Route telemetry for {origin} → {destination}
              </p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close assistant drawer"
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 mt-1">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-medium shadow-sm"
                    : "border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 text-slate-800 dark:text-slate-200"
                }`}
              >
                {m.badge && (
                  <span className="mb-2 inline-block rounded-md bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                    {m.badge}
                  </span>
                )}
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>

              {m.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mt-1">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing live pricing signals...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 p-3 bg-slate-50/50 dark:bg-slate-950/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Suggested Queries:
          </p>
          <div className="flex flex-col gap-1.5">
            {DEFAULT_SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(s)}
                className="flex items-center justify-between text-left text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:border-cyan-500/50 hover:text-cyan-600 dark:hover:text-cyan-400 transition"
              >
                <span className="truncate">{s}</span>
                <ArrowRight className="h-3 w-3 shrink-0 ml-1 opacity-50" />
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="border-t border-slate-200/70 dark:border-slate-800/70 p-3 sm:p-4 flex gap-2"
        >
          <label htmlFor={formInputId} className="sr-only">
            Ask NAPIER Copilot
          </label>
          <input
            id={formInputId}
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${origin} → ${destination} fares...`}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-cyan-500"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </aside>
    </>
  );
}
