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
  { origin: "DEL", dest: "BOM", label: "DEL → BOM (Delhi - Mumbai)" },
  { origin: "BLR", dest: "DEL", label: "BLR → DEL (Bengaluru - Delhi)" },
  { origin: "HYD", dest: "BLR", label: "HYD → BLR (Hyderabad - Bengaluru)" },
  { origin: "BOM", dest: "GOI", label: "BOM → GOI (Mumbai - Goa)" },
  { origin: "MAA", dest: "DEL", label: "MAA → DEL (Chennai - Delhi)" },
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

  // Autocomplete states
  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<AirportItem[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<AirportItem[]>([]);
  const [showOriginMenu, setShowOriginMenu] = useState(false);
  const [showDestMenu, setShowDestMenu] = useState(false);

  const originBlurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const destBlurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const originInputId = useId();
  const destInputId = useId();
  const dateInputId = useId();

  useEffect(() => {
    return () => {
      if (originBlurTimeoutRef.current) clearTimeout(originBlurTimeoutRef.current);
      if (destBlurTimeoutRef.current) clearTimeout(destBlurTimeoutRef.current);
    };
  }, []);

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
    const tempOrigin = origin;
    setOrigin(destination);
    setDestination(tempOrigin);
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
    <section className="glass relative z-30 p-5 sm:p-7 md:p-8 shadow-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Main Search Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 items-end">
          {/* Origin Airport Input */}
          <div className="relative md:col-span-4">
            <label
              htmlFor={originInputId}
              className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Origin (Departure Airport)
            </label>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-400">
                <MapPin className="h-4 w-4 text-cyan-500" />
              </div>
              <input
                id={originInputId}
                type="text"
                value={originQuery ? originQuery : origin}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setOriginQuery(val);
                  if (val.length === 3) setOrigin(val);
                }}
                onFocus={() => setShowOriginMenu(true)}
                onBlur={() => {
                  originBlurTimeoutRef.current = setTimeout(() => {
                    setShowOriginMenu(false);
                    setOriginQuery("");
                  }, 200);
                }}
                placeholder="Airport or City (e.g. DEL)"
                aria-label="Origin Airport code or city"
                className="min-h-[48px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 pl-10 pr-16 py-2.5 font-mono text-sm font-bold text-slate-900 dark:text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <span className="pointer-events-none absolute right-3.5 text-xs font-semibold text-slate-400 truncate max-w-[80px]">
                {getAirportCity(origin)}
              </span>
            </div>

            {/* Origin Suggestions Dropdown */}
            {showOriginMenu && originSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50 p-1">
                {originSuggestions.map((item) => (
                  <button
                    key={`origin-${item.iata}`}
                    type="button"
                    onMouseDown={() => {
                      setOrigin(item.iata);
                      setOriginQuery("");
                      setShowOriginMenu(false);
                    }}
                    className="flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.city} ({item.iata})
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                        {item.name}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      {item.iata}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Airports Button (Min 44px tap target) */}
          <div className="flex justify-center md:col-span-1">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap origin and destination airports"
              title="Swap origin and destination"
              className="flex h-12 w-12 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-850 text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-500 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          {/* Destination Airport Input */}
          <div className="relative md:col-span-4">
            <label
              htmlFor={destInputId}
              className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Destination (Arrival Airport)
            </label>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-400">
                <MapPin className="h-4 w-4 text-purple-500" />
              </div>
              <input
                id={destInputId}
                type="text"
                value={destQuery ? destQuery : destination}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setDestQuery(val);
                  if (val.length === 3) setDestination(val);
                }}
                onFocus={() => setShowDestMenu(true)}
                onBlur={() => {
                  destBlurTimeoutRef.current = setTimeout(() => {
                    setShowDestMenu(false);
                    setDestQuery("");
                  }, 200);
                }}
                placeholder="Airport or City (e.g. BOM)"
                aria-label="Destination Airport code or city"
                className="min-h-[48px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 pl-10 pr-16 py-2.5 font-mono text-sm font-bold text-slate-900 dark:text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <span className="pointer-events-none absolute right-3.5 text-xs font-semibold text-slate-400 truncate max-w-[80px]">
                {getAirportCity(destination)}
              </span>
            </div>

            {/* Destination Suggestions Dropdown */}
            {showDestMenu && destSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50 p-1">
                {destSuggestions.map((item) => (
                  <button
                    key={`dest-${item.iata}`}
                    type="button"
                    onMouseDown={() => {
                      setDestination(item.iata);
                      setDestQuery("");
                      setShowDestMenu(false);
                    }}
                    className="flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.city} ({item.iata})
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                        {item.name}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                      {item.iata}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Picker Input */}
          <div className="relative md:col-span-2">
            <label
              htmlFor={dateInputId}
              className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Departure Date
            </label>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id={dateInputId}
                type="date"
                value={date}
                min={isoDate(0)}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Flight departure date"
                className="min-h-[48px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 pl-9 pr-2 py-2.5 font-mono text-xs font-bold text-slate-900 dark:text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* Submit Search Button (Min 44px tap target) */}
          <div className="md:col-span-1">
            <button
              type="submit"
              disabled={loading}
              aria-label="Run airfare query"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Popular Route Shortcuts Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
            Frequent Corridors:
          </span>
          {POPULAR_ROUTES.map((r) => {
            const isActive = origin === r.origin && destination === r.dest;
            return (
              <button
                key={r.label}
                type="button"
                onClick={() => {
                  setOrigin(r.origin);
                  setDestination(r.dest);
                  onSearch(r.origin, r.dest, date);
                }}
                className={`flex min-h-[44px] items-center rounded-xl border px-3.5 py-1.5 text-xs font-mono font-semibold transition hover:scale-105 active:scale-95 cursor-pointer ${
                  isActive
                    ? "border-cyan-500 bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold"
                    : "border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </form>
    </section>
  );
}
