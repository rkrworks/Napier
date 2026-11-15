"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { fetchIndexTrends, type IndexPoint } from "@/lib/api";
import { useIsDark } from "@/lib/theme";
import { History, Database, AlertCircle, RefreshCw } from "lucide-react";

const LEAD_TIMES = [1, 7, 15, 30, 45];

interface HistoricTrendsProps {
  route: string | null;
}

export default function HistoricTrends({ route }: HistoricTrendsProps) {
  const isDark = useIsDark();
  const [lead, setLead] = useState(15);
  const [range, setRange] = useState<"30d" | "ALL">("ALL");
  const [state, setState] = useState<{
    key: string;
    data: IndexPoint[];
    error: string | null;
  } | null>(null);

  const queryKey = route ? `${route}:${lead}` : null;

  useEffect(() => {
    if (!route || !queryKey) return;
    let stale = false;

    fetchIndexTrends(route, lead)
      .then((res) => {
        if (!stale) {
          setState({
            key: queryKey,
            data: res.data,
            error: null,
          });
        }
      })
      .catch((err: Error) => {
        if (!stale) {
          setState({
            key: queryKey,
            data: [],
            error: err.message,
          });
        }
      });

    return () => {
      stale = true;
    };
  }, [route, lead, queryKey]);

  const loading = !!queryKey && state?.key !== queryKey;

  const rows = useMemo(() => {
    if (!state || state.key !== queryKey) return [];
    if (range === "ALL") return state.data;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return state.data.filter((d) => new Date(d.calculation_date) >= cutoff);
  }, [state, queryKey, range]);

  const axisColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(15, 23, 42, 0.08)";

  const pillClass = (active: boolean) =>
    `min-h-[36px] rounded-lg px-3 py-1 text-xs font-bold transition ${
      active
        ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-sm"
        : "glass-inner text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
    }`;

  return (
    <section className="glass p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-purple-500" />
            <h2 className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
              Archived Jevons Price Index
            </h2>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {route ? `Tracking ${route} relative to 100.0 (₹4,000 base)` : "Select a route to view history"}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="lead-select"
              className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Lead:
            </label>
            <select
              id="lead-select"
              value={lead}
              onChange={(e) => setLead(Number(e.target.value))}
              aria-label="Lead time days"
              className="min-h-[36px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-850 px-3 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
            >
              {LEAD_TIMES.map((d) => (
                <option key={d} value={d}>
                  {d}-day lead
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className={pillClass(range === "30d")}
              onClick={() => setRange("30d")}
            >
              30 Days
            </button>
            <button
              type="button"
              className={pillClass(range === "ALL")}
              onClick={() => setRange("ALL")}
            >
              All Archive
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!route ? (
        <div className="flex h-72 min-h-[280px] flex-col items-center justify-center text-center">
          <Database className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            No route currently selected
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analyze a route above to pull historical price index telemetry.
          </p>
        </div>
      ) : loading ? (
        <div className="flex h-72 min-h-[280px] flex-col items-center justify-center text-center">
          <RefreshCw className="h-8 w-8 text-cyan-500 animate-spin mb-2" />
          <p className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
            Querying Supabase index archive for {route} ({lead}-day lead)...
          </p>
        </div>
      ) : state?.error ? (
        <div className="flex h-72 min-h-[280px] flex-col items-center justify-center text-center p-4">
          <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
          <p className="text-sm font-bold text-rose-500">Supabase Archive Offline</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">{state.error}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex h-72 min-h-[280px] flex-col items-center justify-center text-center p-4">
          <Database className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No Archived Index Records Yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
            No historical Jevons index points exist for {route} at a {lead}-day lead. Run{" "}
            <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px]">
              python backend/napier_engine.py
            </code>{" "}
            to compute and archive historical daily metrics.
          </p>
        </div>
      ) : (
        <div className="h-80 min-h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 15, right: 15, left: 10, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="calculation_date"
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11 }}
              />
              <YAxis
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }}
                domain={["auto", "auto"]}
                width={50}
              />
              <ReferenceLine
                y={100}
                stroke="#06b6d4"
                strokeDasharray="4 4"
                label={{
                  value: "Base 100.0 (₹4,000)",
                  fill: "#06b6d4",
                  fontSize: 10,
                  position: "top",
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload as IndexPoint;
                  return (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md">
                      <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {d.calculation_date}
                      </p>
                      <p className="text-base font-extrabold text-purple-500 font-mono mt-0.5">
                        Index: {d.jevons_index_value.toFixed(2)}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Avg Base Fare: ₹{Math.round(d.avg_base_fare).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Samples: {d.sample_count} flights
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="jevons_index_value"
                name="Jevons Index"
                stroke="#a855f7"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#a855f7" }}
                activeDot={{ r: 6, fill: "#06b6d4" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
