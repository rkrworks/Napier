"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CarrierQuote } from "@/lib/api";
import { inr } from "@/lib/format";
import { useIsDark } from "@/lib/theme";
import { BarChart3 } from "lucide-react";

interface FareChartProps {
  quotes: CarrierQuote[];
  routeCode?: string;
}

export default function FareChart({ quotes, routeCode }: FareChartProps) {
  const isDark = useIsDark();

  const data = useMemo(() => {
    return quotes.map((q) => ({
      name: q.name,
      code: q.code,
      price: q.price,
      stops: q.stops,
    }));
  }, [quotes]);

  const { cheapest, priciest } = useMemo(() => {
    if (quotes.length === 0) return { cheapest: null, priciest: null };
    const sorted = [...quotes].sort((a, b) => a.price - b.price);
    return { cheapest: sorted[0], priciest: sorted[sorted.length - 1] };
  }, [quotes]);

  const axisColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(15, 23, 42, 0.08)";

  if (quotes.length === 0) {
    return (
      <section className="glass p-5 sm:p-6 shadow-xl">
        <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mb-2">
          Carrier Fare Comparison
        </h3>
        <div className="flex h-80 min-h-[320px] flex-col items-center justify-center text-center">
          <BarChart3 className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fare comparison chart will display here once live carrier quotes are loaded.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="glass p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
        <div>
          <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
            Carrier Fare Spread Comparison
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Direct price variance across airlines for {routeCode || "selected route"}
          </p>
        </div>

        {cheapest && priciest && cheapest.price !== priciest.price && (
          <div className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
            Spread:{" "}
            <span className="font-bold text-cyan-600 dark:text-cyan-400">
              {inr(priciest.price - cheapest.price)}
            </span>
          </div>
        )}
      </div>

      {/* Screen Reader Accessible Summary */}
      {cheapest && priciest && (
        <p className="sr-only">
          Airfare comparison for {routeCode || "this route"}. The cheapest airline is{" "}
          {cheapest.name} at {inr(cheapest.price)}. The most expensive airline is{" "}
          {priciest.name} at {inr(priciest.price)}. Total carriers compared: {quotes.length}.
        </p>
      )}

      {/* Recharts Chart with Explicit Height */}
      <div className="h-80 min-h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 15, right: 15, left: 10, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="name"
              stroke={axisColor}
              tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }}
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              stroke={axisColor}
              tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }}
              tickFormatter={(v: number) => inr(v)}
              domain={["auto", "auto"]}
              width={75}
            />
            <Tooltip
              cursor={{ fill: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)" }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0].payload;
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {p.name} ({p.code})
                    </p>
                    <p className="text-base font-extrabold text-cyan-500 font-mono mt-1">
                      {inr(p.price)}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {p.stops === 0 ? "Non-stop flight" : `${p.stops} connecting stop(s)`}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="price" radius={[8, 8, 0, 0]} maxBarSize={55}>
              {data.map((entry) => (
                <Cell
                  key={`cell-${entry.code}`}
                  fill={
                    cheapest && entry.price === cheapest.price
                      ? "#06b6d4"
                      : isDark
                      ? "#6366f1"
                      : "#4f46e5"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
