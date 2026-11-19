"use client";

import { useState } from "react";
import { useIsDark, toggleTheme } from "@/lib/theme";
import { Plane, Sparkles, ExternalLink, Sun, Moon, Menu, X } from "lucide-react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fallbackGfUrl = "https://www.google.com/travel/flights?q=flights+from+DEL+to+BOM&curr=INR&gl=in&hl=en";
  const flightsTargetUrl = googleFlightsUrl || fallbackGfUrl;

  const navLinks = [
    { href: "#search", label: "Route Query" },
    { href: "#carriers", label: "Live Fares" },
    { href: "#analytics", label: "Index & Forecast" },
    { href: "#trends", label: "Historical Trends" },
    { href: "#about", label: "Methodology" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full transition-colors duration-200">
      <div className="glass px-4 py-3 sm:px-6 sm:py-3.5 shadow-lg mx-auto border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center justify-between gap-4">
          {/* Brand & Wordmark */}
          <div className="flex items-center gap-3">
            <a
              href="#top"
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-xl"
              aria-label="NAPIER v2.0 - Return to top"
            >
              <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <Plane className="h-5 w-5 text-white transform -rotate-45" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl sm:text-2xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    NAPIER
                  </span>
                  <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                    v2.0
                  </span>
                </div>
                <p className="hidden sm:block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  National Airfare Price Index · Real-Time Telemetry
                </p>
              </div>
            </a>

            {/* Telemetry Status Badge */}
            <div className="hidden xl:flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 px-3 py-1 ml-2">
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
                {isBackendHealthy ? "LIVE GOOGLE FLIGHTS TELEMETRY" : "CONNECTING ENGINE..."}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors py-1 focus:outline-none focus-visible:underline"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Direct Google Flights External Verification Link */}
            <a
              href={flightsTargetUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Verify pricing on Google Flights India (POS: gl=in, curr=INR)"
              className="flex min-h-[44px] items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-850 px-3 sm:px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span className="hidden sm:inline">Google Flights</span>
              <span className="sm:hidden">GFlights</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>

            {/* AI Assistant Button */}
            <button
              type="button"
              onClick={onOpenAssistant}
              aria-label="Open NAPIER AI route copilot"
              className="flex min-h-[44px] items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 px-3 sm:px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden md:inline">AI Copilot</span>
            </button>

            {/* Theme Toggle Button (44px min tap target) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              title={isDark ? "Switch to light theme" : "Switch to dark theme"}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-850 text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 cursor-pointer"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="lg:hidden flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-850 text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
