"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import GlassCard from "./GlassCard";
import { duration, inr, stopsLabel } from "@/lib/format";
import type { CarrierQuote } from "@/lib/api";

type SortKey = "recommended" | "price-asc" | "price-desc" | "name";

export default function CarrierCards({
  quotes,
  route,
  fetchedAt,
}: {
  quotes: CarrierQuote[];
  route: string;
  fetchedAt?: string;
}) {
  const [sort, setSort] = useState<SortKey>("recommended");

  const fetchedAtFormatted = useMemo(() => {
    if (!fetchedAt) return null;
    try {
      const d = new Date(fetchedAt);
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      const parts = new Intl.DateTimeFormat([], { timeZoneName: "short" }).formatToParts(d);
      const tz = parts.find((p) => p.type === "timeZoneName")?.value || "UTC";
      return `Fares fetched at ${timeStr} ${tz}`;
    } catch {
      return null;
    }
  }, [fetchedAt]);

  const sorted = useMemo(() => {
    const list = [...quotes];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [quotes, sort]);

  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-col justify-between gap-4 border-b border-slate-200/70 pb-4 sm:flex-row sm:items-center dark:border-slate-800/70">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <span className="h-2.5 w-2.5 animate-ping rounded-full bg-cyan-500" />
            Live fares · {route}
          </h2>
          {fetchedAtFormatted && (
            <p className="mt-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              {fetchedAtFormatted}
            </p>
          )}
          <p className="muted mt-0.5 text-xs">
            One-way results from Google Flights. Select a card to view flight details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-carriers" className="muted shrink-0 text-xs font-semibold">
            Sort by:
          </label>
          <select
            id="sort-carriers"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="glass-inner min-h-[44px] px-3 py-2 text-xs font-medium outline-none transition focus:ring-2 focus:ring-cyan-400/70"
          >
            <option value="recommended">Recommended</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Airline name</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((c) => (
          <a
            key={c.name}
            href={c.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-inner group flex flex-col justify-between p-4 transition hover:-translate-y-1 hover:border-cyan-400/70"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{c.name}</span>
                <span className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] dark:bg-slate-800">{c.code}</span>
              </div>
              <p className="muted mt-2 text-[11px]">
                {[stopsLabel(c.stops), duration(c.duration_min)].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="mt-4 border-t border-slate-200/70 pt-3 dark:border-slate-800/70">
              <p className="muted text-[10px]">One-way fare</p>
              <p className="text-xl font-extrabold transition group-hover:text-cyan-500">{inr(c.price)}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-purple-500">
                View on Google Flights <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </GlassCard>
  );
}
