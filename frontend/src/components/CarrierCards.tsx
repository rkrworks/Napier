"use client";

import { useId, useState } from "react";
import { Clock, ExternalLink, Plane, CheckCircle2, ShieldCheck } from "lucide-react";
import type { CarrierQuote } from "@/lib/api";
import { duration, inr, stopsLabel, formatFetchedAt, formatFlightTime } from "@/lib/format";

interface CarrierCardsProps {
  quotes: CarrierQuote[];
  fetchedAt?: string;
  routeCode?: string;
}

const CARRIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  IndiGo: { bg: "bg-blue-500/10", text: "text-blue-500 dark:text-blue-400", border: "border-blue-500/30" },
  "Air India": { bg: "bg-red-500/10", text: "text-red-500 dark:text-red-400", border: "border-red-500/30" },
  Vistara: { bg: "bg-purple-500/10", text: "text-purple-500 dark:text-purple-400", border: "border-purple-500/30" },
  "Akasa Air": { bg: "bg-orange-500/10", text: "text-orange-500 dark:text-orange-400", border: "border-orange-500/30" },
  SpiceJet: { bg: "bg-amber-500/10", text: "text-amber-500 dark:text-amber-400", border: "border-amber-500/30" },
  "Air India Express": { bg: "bg-rose-500/10", text: "text-rose-500 dark:text-rose-400", border: "border-rose-500/30" },
};

export default function CarrierCards({ quotes, fetchedAt, routeCode }: CarrierCardsProps) {
  const [sortKey, setSortKey] = useState<"price" | "duration">("price");
  const sortSelectId = useId();

  const sortedQuotes = [...quotes].sort((a, b) => {
    if (sortKey === "duration") {
      return (a.duration_min ?? 9999) - (b.duration_min ?? 9999);
    }
    return a.price - b.price;
  });

  const lowestPrice = quotes.length > 0 ? Math.min(...quotes.map((q) => q.price)) : 0;

  return (
    <section className="glass p-5 sm:p-7 md:p-8 space-y-6">
      {/* Header with Sort and Fetched Timestamp */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
              Live Carrier Quotes
            </h3>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono">
              {quotes.length} {quotes.length === 1 ? "Airline" : "Airlines"}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {formatFetchedAt(fetchedAt)} · Sourced live from Google Flights India (gl=in)
          </p>
        </div>

        {/* Accessible Sort Control */}
        {quotes.length > 1 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label
              htmlFor={sortSelectId}
              className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Sort by:
            </label>
            <select
              id={sortSelectId}
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as "price" | "duration")}
              className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-850 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="price">Lowest Fare First</option>
              <option value="duration">Fastest Flight First</option>
            </select>
          </div>
        )}
      </div>

      {/* Carrier Cards Grid */}
      {quotes.length === 0 ? (
        <div className="py-16 text-center">
          <Plane className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600 mb-3" />
          <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">
            No Carrier Quotes Loaded
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            Quotes for {routeCode || "this corridor"} could not be retrieved from Google Flights.
            Try selecting a different corridor or date.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedQuotes.map((q) => {
            const isLowest = q.price === lowestPrice;
            const carrierStyle = CARRIER_COLORS[q.name] || {
              bg: "bg-slate-500/10",
              text: "text-slate-700 dark:text-slate-300",
              border: "border-slate-500/30",
            };

            return (
              <div
                key={`${q.code}-${q.name}-${q.price}-${q.departure_time || ""}`}
                className={`relative flex flex-col justify-between rounded-2xl border bg-white/60 dark:bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                  isLowest
                    ? "border-cyan-500/50 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30"
                    : "border-slate-200/80 dark:border-slate-800/80"
                }`}
              >
                {/* Lowest Fare Banner */}
                {isLowest && (
                  <div className="absolute -top-3 right-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Best Live Fare</span>
                  </div>
                )}

                {/* Top Carrier Header */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-lg border px-2 py-0.5 font-mono text-xs font-bold ${carrierStyle.bg} ${carrierStyle.text} ${carrierStyle.border}`}
                        >
                          {q.code}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                          {q.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {stopsLabel(q.stops)}
                        {q.is_connecting && q.operating_carriers && q.operating_carriers.length > 0 && (
                          <span> · Via {q.operating_carriers.join(", ")}</span>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {inr(q.price)}
                      </p>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                        Exact Quote
                      </p>
                    </div>
                  </div>

                  {/* Flight Timing & Duration Row */}
                  <div className="mt-5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-850/50 p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Departure</p>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                        {formatFlightTime(q.departure_time)}
                      </p>
                    </div>

                    <div className="flex flex-col items-center px-2">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>{duration(q.duration_min)}</span>
                      </div>
                      <div className="flex items-center gap-1 w-16 sm:w-20 my-1">
                        <div className="h-[1px] flex-1 bg-slate-300 dark:bg-slate-700" />
                        <Plane className="h-3 w-3 text-slate-400 transform rotate-90" />
                        <div className="h-[1px] flex-1 bg-slate-300 dark:bg-slate-700" />
                      </div>
                      <span className="text-[10px] text-slate-400">{stopsLabel(q.stops)}</span>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Arrival</p>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                        {formatFlightTime(q.arrival_time)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booking & Verification Link */}
                <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>POS India Verified</span>
                  </div>

                  <a
                    href={q.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-slate-900 shadow-sm transition hover:bg-slate-800 dark:hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <span>View Flight</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
