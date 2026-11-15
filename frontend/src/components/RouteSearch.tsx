"use client";

import { useEffect, useRef, useState, useId } from "react";
import { ArrowLeftRight, Calendar, Search, MapPin, Loader2 } from "lucide-react";
import { fetchAirports, STATIC_AIRPORTS, type AirportItem } from "@/lib/api";
import { isoDate } from "@/lib/format";

interface RouteSearchProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialDate?: string;
  loading?: boolean;
  onSearch: (origin: string, destination: string, date: string) => void;
}

const POPULAR_ROUTES = [
  { origin: "DEL", dest: "BOM", label: "DEL → BOM" },
  { origin: "BLR", dest: "DEL", label: "BLR → DEL" },
  { origin: "HYD", dest: "BLR", label: "HYD → BLR" },
  { origin: "BOM", dest: "GOI", label: "BOM → GOI" },
  { origin: "MAA", dest: "DEL", label: "MAA → DEL" },
];

export default function RouteSearch({
  initialOrigin = "DEL",
  initialDestination = "BOM",
  initialDate,
  loading = false,
  onSearch,
}: RouteSearchProps) {
  const [origin, setOrigin] = useState(initialOrigin.toUpperCase());
  const [destination, setDestination] = useState(initialDestination.toUpperCase());
  const [date, setDate] = useState(initialDate || isoDate(1));

  // Autocomplete query states
  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<AirportItem[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<AirportItem[]>([]);
  const [showOriginMenu, setShowOriginMenu] = useState(false);
  const [showDestMenu, setShowDestMenu] = useState(false);

  const originBlurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const destBlurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSwappingRef = useRef(false);

  const originInputId = useId();
  const destInputId = useId();
  const dateInputId = useId();

  // Clear blur timeouts on unmount
  useEffect(() => {
    return () => {
      if (originBlurTimeoutRef.current) clearTimeout(originBlurTimeoutRef.current);
      if (destBlurTimeoutRef.current) clearTimeout(destBlurTimeoutRef.current);
    };
  }, []);

  // Update suggestions when user types
  useEffect(() => {
    if (!showOriginMenu) return;
    let active = true;
    fetchAirports(originQuery || origin).then((items) => {
      if (active) setOriginSuggestions(items);
    });
    return () => {
      active = false;
    };
  }, [originQuery, origin, showOriginMenu]);

  useEffect(() => {
    if (!showDestMenu) return;
    let active = true;
    fetchAirports(destQuery || destination).then((items) => {
      if (active) setDestSuggestions(items);
    });
    return () => {
      active = false;
    };
  }, [destQuery, destination, showDestMenu]);

  const handleSwap = () => {
    isSwappingRef.current = true;
    const tempOrigin = origin;
    setOrigin(destination);
    setDestination(tempOrigin);
    setTimeout(() => {
      isSwappingRef.current = false;
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;
    if (origin === destination) return;
    onSearch(origin, destination, date);
  };

  const getAirportCity = (code: string) => {
    const item = STATIC_AIRPORTS.find((a) => a.iata === code);
    return item ? item.city : code;
  };

  return (
    <section className="glass relative z-30 p-4 sm:p-6 shadow-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Main Search Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_auto] gap-3 items-center">
          {/* Origin Airport Combobox */}
          <div className="relative">
            <label
              htmlFor={originInputId}
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
            >
              Origin Airport
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 px-3 py-2 transition focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20">
              <MapPin className="h-4 w-4 text-cyan-500 shrink-0 mr-2" />
              <div className="flex flex-col min-w-0 flex-1">
                <input
                  id={originInputId}
                  type="text"
                  value={showOriginMenu ? originQuery : `${origin} · ${getAirportCity(origin)}`}
                  onChange={(e) => {
                    setOriginQuery(e.target.value);
                    if (!showOriginMenu) setShowOriginMenu(true);
                  }}
                  onFocus={() => {
                    setOriginQuery(origin);
                    setShowOriginMenu(true);
                  }}
                  onBlur={() => {
                    originBlurTimeoutRef.current = setTimeout(() => {
                      setShowOriginMenu(false);
                    }, 250);
                  }}
                  placeholder="DEL, Delhi..."
                  autoComplete="off"
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
              <span className="font-mono text-sm font-bold text-cyan-600 dark:text-cyan-400 shrink-0 ml-1">
                {origin}
              </span>
            </div>

            {/* Suggestions Dropdown */}
            {showOriginMenu && originSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-1">
                {originSuggestions.map((a) => (
                  <button
                    key={`origin-${a.iata}`}
                    type="button"
                    onMouseDown={() => {
                      setOrigin(a.iata);
                      setOriginQuery("");
                      setShowOriginMenu(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {a.city}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        {a.name}
                      </span>
                    </div>
                    <span className="font-mono font-black text-cyan-600 dark:text-cyan-400 ml-2">
                      {a.iata}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button (44px min tap target) */}
          <div className="flex justify-center -my-1 md:my-0">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap origin and destination"
              title="Swap airports"
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:rotate-180 active:scale-90"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          {/* Destination Airport Combobox */}
          <div className="relative">
            <label
              htmlFor={destInputId}
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
            >
              Destination Airport
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 px-3 py-2 transition focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
              <MapPin className="h-4 w-4 text-purple-500 shrink-0 mr-2" />
              <div className="flex flex-col min-w-0 flex-1">
                <input
                  id={destInputId}
                  type="text"
                  value={showDestMenu ? destQuery : `${destination} · ${getAirportCity(destination)}`}
                  onChange={(e) => {
                    setDestQuery(e.target.value);
                    if (!showDestMenu) setShowDestMenu(true);
                  }}
                  onFocus={() => {
                    setDestQuery(destination);
                    setShowDestMenu(true);
                  }}
                  onBlur={() => {
                    destBlurTimeoutRef.current = setTimeout(() => {
                      setShowDestMenu(false);
                    }, 250);
                  }}
                  placeholder="BOM, Mumbai..."
                  autoComplete="off"
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
              <span className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400 shrink-0 ml-1">
                {destination}
              </span>
            </div>

            {/* Suggestions Dropdown */}
            {showDestMenu && destSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-1">
                {destSuggestions.map((a) => (
                  <button
                    key={`dest-${a.iata}`}
                    type="button"
                    onMouseDown={() => {
                      setDestination(a.iata);
                      setDestQuery("");
                      setShowDestMenu(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {a.city}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        {a.name}
                      </span>
                    </div>
                    <span className="font-mono font-black text-purple-600 dark:text-purple-400 ml-2">
                      {a.iata}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Departure Date Selector */}
          <div>
            <label
              htmlFor={dateInputId}
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
            >
              Departure Date
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 px-3 py-2 transition focus-within:border-cyan-500">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
              <input
                id={dateInputId}
                type="date"
                value={date}
                min={isoDate(0)}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none w-full"
              />
            </div>
          </div>

          {/* Analyze Route Submit CTA */}
          <div className="pt-5 md:pt-0">
            <button
              type="submit"
              disabled={loading || origin === destination}
              className="flex min-h-[44px] h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 px-6 font-bold text-white shadow-lg shadow-purple-500/25 transition hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Analyze Route</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Popular Route Quick Selection Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Popular Indian Hubs:
          </span>
          {POPULAR_ROUTES.map((r) => {
            const isSelected = origin === r.origin && destination === r.dest;
            return (
              <button
                key={r.label}
                type="button"
                onClick={() => {
                  setOrigin(r.origin);
                  setDestination(r.dest);
                  onSearch(r.origin, r.dest, date);
                }}
                className={`min-h-[32px] rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/40"
                    : "glass-inner text-slate-600 dark:text-slate-300 hover:text-cyan-500 dark:hover:text-cyan-400"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </form>
    </section>
  );
}
