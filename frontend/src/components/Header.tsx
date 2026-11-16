"use client";

import { useIsDark, toggleTheme } from "@/lib/theme";
import { Plane, Sparkles, ExternalLink, Sun, Moon } from "lucide-react";

interface HeaderProps {
  googleFlightsUrl?: string | null;
  onOpenAssistant: () => void;
  isBackendHealthy?: boolean;
}

export default function Header({
  googleFlightsUrl,
  onOpenAssistant,
  isBackendHealthy = true,
}: HeaderProps) {
  const isDark = useIsDark();
  const fallbackGfUrl = "https://www.google.com/travel/flights?q=flights+from+DEL+to+BOM&curr=INR&gl=in";
  const flightsTargetUrl = googleFlightsUrl || fallbackGfUrl;

  return (
    <header className="glass px-5 py-4 sm:px-7 sm:py-5 shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand & Wordmark */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 shadow-md shadow-purple-500/20">
              <Plane className="h-5 w-5 text-white transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-2xl font-black tracking-wider text-transparent font-mono">
                  NAPIER
                </span>
                <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                  v2.0
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                National Airfare Price Index Engine · Real-time
              </p>
            </div>
          </div>

          {/* Telemetry Pulse Indicator */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  isBackendHealthy ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  isBackendHealthy ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </span>
            <span className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300">
              {isBackendHealthy ? "TELEMETRY LIVE" : "COLD STARTING"}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2.5 sm:gap-3">
          {/* Verify on Google Flights button */}
          <a
            href={flightsTargetUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Cross-reference route on Google Flights"
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Google Flights</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>

          {/* AI Assistant Drawer Trigger */}
          <button
            type="button"
            onClick={onOpenAssistant}
            aria-label="Open NAPIER AI assistant drawer"
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden xs:inline">AI Telemetry</span>
          </button>

          {/* Theme Toggle Button (44px min tap target) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
