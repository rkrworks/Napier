"use client";

import { Zap, Calendar, TrendingUp, Info } from "lucide-react";
import type { MLPrediction } from "@/lib/api";
import { inr } from "@/lib/format";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useIsDark } from "@/lib/theme";

interface ForecastPanelProps {
  prediction: MLPrediction;
}

export default function ForecastPanel({ prediction }: ForecastPanelProps) {
  const isDark = useIsDark();

  const horizons = [
    {
      label: "Next hour (1h)",
      value: prediction.predicted_price_1h,
      band: prediction.confidence_corridors["1h"],
      color: "text-cyan-500",
      sub: "Micro-fluctuation horizon",
    },
    {
      label: "Next day (24h)",
      value: prediction.predicted_price_24h,
      band: prediction.confidence_corridors["24h"],
      color: "text-indigo-500",
      sub: "Overnight seat yield shift",
    },
    {
      label: "Next week (7d)",
      value: prediction.predicted_price_7d,
      band: prediction.confidence_corridors["7d"],
      color: "text-purple-500",
      sub: "Lead-time degradation curve",
    },
  ];

  // Generate 30-day forward projection trend curve based on current base fare and festival surge
  const forwardTrendData = [
    { day: "Today", price: prediction.base_fare, note: "Cheapest Live Fare" },
    { day: "+3d", price: Math.round(prediction.base_fare * 1.02), note: "Normal variance" },
    { day: "+7d", price: Math.round(prediction.predicted_price_7d), note: "7-day projection" },
    {
      day: "+14d",
      price: Math.round(
        prediction.base_fare *
          (prediction.holiday_impact_factor === "HIGH"
            ? 1.28
            : prediction.holiday_impact_factor === "MEDIUM"
            ? 1.15
            : 1.05)
      ),
      note: prediction.festival_name ? `${prediction.festival_name} Surge Window` : "Standard advance booking",
    },
    {
      day: "+21d",
      price: Math.round(
        prediction.base_fare *
          (prediction.holiday_impact_factor === "HIGH"
            ? 1.35
            : prediction.holiday_impact_factor === "MEDIUM"
            ? 1.18
            : 1.08)
      ),
      note: "Peak holiday window",
    },
    { day: "+30d", price: Math.round(prediction.base_fare * 1.04), note: "Baseline reversion" },
  ];

  const axisColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(15, 23, 42, 0.08)";

  const isBookNow =
    prediction.recommendation.toUpperCase().includes("BOOK") ||
    prediction.status_badge.includes("SURGE") ||
    prediction.status_badge.includes("RISING");

  return (
    <div className="space-y-5">
      {/* Primary Recommendation Banner */}
      <section className="glass p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                isBookNow
                  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-500"
                  : "border-cyan-500/30 bg-cyan-500/15 text-cyan-500"
              }`}
            >
              <Zap className="h-6 w-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black tracking-wider uppercase font-mono border ${
                    isBookNow
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "border-cyan-500/40 bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
                  }`}
                >
                  {prediction.recommendation}
                </span>

                {prediction.festival_name && (
                  <span className="flex items-center gap-1 rounded-full border border-purple-500/40 bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-600 dark:text-purple-400">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {prediction.festival_name} (+{prediction.holiday_impact_pct}%)
                    </span>
                  </span>
                )}

                <span className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  Impact: {prediction.holiday_impact_factor}
                </span>
              </div>

              <p className="mt-2.5 text-base font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
                {prediction.advice_text}
              </p>
            </div>
          </div>

          {/* Current Live Base Price Anchor */}
          <div className="shrink-0 border-t md:border-t-0 md:border-l border-slate-200/70 dark:border-slate-800/70 pt-4 md:pt-0 md:pl-6 text-left md:text-right">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Cheapest Live Base
            </span>
            <span className="font-mono text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {inr(prediction.base_fare)}
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Source: SerpApi Google Flights
            </span>
          </div>
        </div>
      </section>

      {/* 3 Horizon Projection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {horizons.map((h) => (
          <div
            key={h.label}
            className="glass flex flex-col justify-between p-5 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {h.label}
                </span>
                <TrendingUp className={`h-4 w-4 ${h.color}`} />
              </div>
              <p className={`mt-2 font-mono text-3xl font-black tabular-nums tracking-tight ${h.color}`}>
                {inr(h.value)}
              </p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                {h.sub}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">95% Confidence</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                {inr(h.band.lower)} – {inr(h.band.upper)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 30-Day Forward Price Trajectory Chart */}
      <section className="glass p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
          <div>
            <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              30-Day Forward Fare Trajectory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Projected booking curve factoring holiday spikes & lead-time yield decay
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Info className="h-3.5 w-3.5" />
            <span>Rule-based heuristic projection</span>
          </div>
        </div>

        <div className="h-72 min-h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forwardTrendData} margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="fareTrajectoryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="day" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
              <YAxis
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }}
                tickFormatter={(v: number) => inr(v)}
                domain={["auto", "auto"]}
                width={75}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{p.day}</p>
                      <p className="text-base font-extrabold text-cyan-500 font-mono mt-0.5">
                        {inr(p.price)}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{p.note}</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#fareTrajectoryGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
