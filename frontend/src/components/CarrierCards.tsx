"use client";

import { useId, useState } from "react";
import { Clock, ExternalLink, ArrowRight, Plane, CheckCircle2 } from "lucide-react";
import type { CarrierQuote } from "@/lib/api";
import { duration, inr, stopsLabel, formatFetchedAt, formatFlightTime } from "@/lib/format";

interface CarrierCardsProps {
  quotes: CarrierQuote[];
  fetchedAt?: string;
  routeCode?: string;
}

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
    <section className="glass p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header with Sort and Fetched Timestamp */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
              Live Carrier Quotes
            </h2>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono">
              {quotes.length} {quotes.length === 1 ? "Airline" : "Airlines"}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {formatFetchedAt(fetchedAt)}
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
              className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-850 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-cyan-500"
            >
              <option value="price">Lowest Price</option>
              <option value="duration">Shortest Duration</option>
            </select>
          </div>
        )}
      </div>

      {/* Carrier Cards Grid */}
      {quotes.length === 0 ? (
        <div className="py-12 text-center">
          <Plane className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
            No Carrier Quotes Available
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            Live quotes for {routeCode || "this route"} could not be retrieved from SerpApi.
            Try another route or date.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedQuotes.map((q, idx) => {
            const isCheapest = q.price === lowestPrice;
            const hasExactBookingToken =
              q.booking_url.includes("booking_token=") || q.booking_url.includes("departure_token=");

            return (
              <div
                key={`${q.code}-${idx}`}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition hover:-translate-y-1 hover:shadow-lg ${
                  isCheapest
                    ? "border-cyan-500/50 bg-gradient-to-b from-cyan-500/10 via-slate-900/40 to-slate-900/60 shadow-cyan-500/10"
                    : "border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40"
                }`}
              >
                {/* Top Carrier Line */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-mono text-xs font-black text-slate-700 dark:text-slate-200">
                        {q.code}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                          {q.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              q.stops === 0 && !q.is_connecting
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {stopsLabel(q.stops, q.is_connecting)}
                          </span>
                          {q.duration_min && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              <Clock className="h-3 w-3" />
                              {duration(q.duration_min)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isCheapest && (
                      <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                        <CheckCircle2 className="h-3 w-3" />
                        Best Value
                      </span>
                    )}
                  </div>

                  {/* Flight Times & Operating Carriers */}
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 text-xs">
                    <div className="text-left">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">
                        Departure
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatFlightTime(q.departure_time)}
                      </span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-60" />
                    <div className="text-right">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">
                        Arrival
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatFlightTime(q.arrival_time)}
                      </span>
                    </div>
                  </div>

                  {q.operating_carriers && q.operating_carriers.length > 1 && (
                    <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Operating: {q.operating_carriers.join(", ")}
                    </p>
                  )}
                </div>

                {/* Bottom Fare & Booking CTA */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Cheapest Quote
                    </span>
                    <span className="font-mono text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                      {inr(q.price)}
                    </span>
                  </div>

                  <a
                    href={q.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={
                      hasExactBookingToken
                        ? "Open exact itinerary on Google Flights booking partner"
                        : "View itinerary on Google Flights"
                    }
                    className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-cyan-600 dark:hover:bg-cyan-500 active:scale-95"
                  >
                    <span>{hasExactBookingToken ? "Book Itinerary" : "Google Flights"}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
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
