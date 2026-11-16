"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import RouteSearch from "@/components/RouteSearch";
import CarrierCards from "@/components/CarrierCards";
import FareChart from "@/components/FareChart";
import ForecastPanel from "@/components/ForecastPanel";
import HistoricTrends from "@/components/HistoricTrends";
import AssistantDrawer from "@/components/AssistantDrawer";
import {
  fetchRoutePrediction,
  type MLPrediction,
  ApiError,
} from "@/lib/api";
import { inr, isoDate } from "@/lib/format";
import {
  TrendingDown,
  Layers,
  Gauge,
  CalendarCheck,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Activity,
  Plane,
} from "lucide-react";

export default function Home() {
  const [origin, setOrigin] = useState("DEL");
  const [destination, setDestination] = useState("BOM");
  const [departureDate, setDepartureDate] = useState(() => isoDate(1));
  const [prediction, setPrediction] = useState<MLPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveDataUnavailable, setLiveDataUnavailable] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");

  const routeCode = `${origin}-${destination}`;
  const googleFlightsUrl =
    prediction?.google_flights_url ||
    `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}+on+${departureDate}&curr=INR&gl=in`;

  useEffect(() => {
    let active = true;

    fetchRoutePrediction(origin, destination, departureDate)
      .then((res) => {
        if (!active) return;
        setPrediction(res);
        setLiveDataUnavailable(false);
        setErrorMessage(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoading(false);
        if (err instanceof ApiError && err.code === "LIVE_DATA_UNAVAILABLE") {
          setLiveDataUnavailable(true);
          setErrorMessage(err.message || "Live fares are currently unavailable from SerpApi.");
        } else if (err instanceof ApiError && err.status === 503) {
          setLiveDataUnavailable(true);
          setErrorMessage(err.message || "Live airfare provider is temporarily unavailable.");
        } else {
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to load telemetry for this route."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [origin, destination, departureDate]);

  const handleSearch = (newOrigin: string, newDest: string, newDate: string) => {
    setLoading(true);
    setErrorMessage(null);
    setOrigin(newOrigin);
    setDestination(newDest);
    setDepartureDate(newDate);
  };

  const handleRetry = () => {
    setLoading(true);
    setErrorMessage(null);
    setLiveDataUnavailable(false);
    fetchRoutePrediction(origin, destination, departureDate)
      .then((res) => {
        setPrediction(res);
        setLiveDataUnavailable(false);
        setErrorMessage(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setLoading(false);
        if (err instanceof ApiError && err.code === "LIVE_DATA_UNAVAILABLE") {
          setLiveDataUnavailable(true);
          setErrorMessage(err.message || "Live fares are currently unavailable from SerpApi.");
        } else if (err instanceof ApiError && err.status === 503) {
          setLiveDataUnavailable(true);
          setErrorMessage(err.message || "Live airfare provider is temporarily unavailable.");
        } else {
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to load telemetry for this route."
          );
        }
      });
  };

  // KPI Calculations
  const quotes = prediction?.live_carrier_quotes || [];
  const lowestFare = quotes.length > 0 ? Math.min(...quotes.map((q) => q.price)) : null;
  const highestFare = quotes.length > 0 ? Math.max(...quotes.map((q) => q.price)) : null;
  const fareSpread =
    lowestFare !== null && highestFare !== null ? highestFare - lowestFare : null;

  // Jevons index relative to 4000 INR baseline
  const jevonsRelativeIndex = lowestFare ? (lowestFare / 4000) * 100 : null;
  const jevonsDelta = jevonsRelativeIndex ? jevonsRelativeIndex - 100 : null;

  return (
    <div className="flex min-h-screen flex-col selection:bg-cyan-500/20 selection:text-cyan-400">
      {/* Top Floating Glass Navigation Header */}
      <div className="wrap pt-3">
        <Header
          googleFlightsUrl={googleFlightsUrl}
          onOpenAssistant={() => setAssistantOpen(true)}
          isBackendHealthy={!errorMessage || liveDataUnavailable}
        />
      </div>

      {/* Main Body with Taste-Skill .wrap Grid System */}
      <main className="wrap flex-1 py-6 space-y-6">
        {/* Command Center Flight Search */}
        <RouteSearch
          initialOrigin={origin}
          initialDestination={destination}
          initialDate={departureDate}
          loading={loading}
          onSearch={handleSearch}
        />

        {/* Tab Switcher: Live Telemetry vs Archived Index */}
        <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/70 pb-3">
          <div className="seg">
            <button
              type="button"
              aria-pressed={activeTab === "live"}
              onClick={() => setActiveTab("live")}
              className="cursor-pointer"
            >
              Live Telemetry &amp; Analytics
            </button>
            <button
              type="button"
              aria-pressed={activeTab === "history"}
              onClick={() => setActiveTab("history")}
              className="cursor-pointer"
            >
              Archived Jevons Index Trends
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono font-medium text-slate-400">
            <Activity className="h-3.5 w-3.5 text-cyan-500" />
            <span>ROUTE: {routeCode}</span>
          </div>
        </div>

        {/* 4-Card KPI Telemetry Summary Strip */}
        <section aria-label="Key Flight Telemetry Metrics">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Lowest Live Fare */}
            <div className="card p-5 sm:p-6 flex flex-col justify-between transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Lowest Live Fare
                </span>
                <TrendingDown className="h-4 w-4 text-cyan-500" />
              </div>
              <div className="mt-3">
                <p className="font-mono text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {lowestFare ? inr(lowestFare) : liveDataUnavailable ? "Indicative only" : "—"}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {lowestFare
                    ? `${quotes[0]?.name || "Carrier"} one-way`
                    : liveDataUnavailable
                    ? "Live SerpApi key required"
                    : "Fetching live fares..."}
                </p>
              </div>
            </div>

            {/* Card 2: Route Spread & Carrier Count */}
            <div className="card p-5 sm:p-6 flex flex-col justify-between transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Carrier Count &amp; Spread
                </span>
                <Layers className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-3">
                <p className="font-mono text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {quotes.length > 0 ? `${quotes.length} Airlines` : "0 Airlines"}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {fareSpread !== null ? `Spread: ${inr(fareSpread)} variance` : "No quote dispersion"}
                </p>
              </div>
            </div>

            {/* Card 3: Jevons Price Index */}
            <div className="card p-5 sm:p-6 flex flex-col justify-between transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Jevons Price Index
                </span>
                <Gauge className="h-4 w-4 text-purple-500" />
              </div>
              <div className="mt-3">
                <p className="font-mono text-3xl font-black text-purple-500 tabular-nums tracking-tight">
                  {jevonsRelativeIndex ? jevonsRelativeIndex.toFixed(1) : "100.0"}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {jevonsDelta !== null
                    ? `${jevonsDelta >= 0 ? "+" : ""}${jevonsDelta.toFixed(1)}% vs ₹4,000 baseline`
                    : "Relative to base 100.0"}
                </p>
              </div>
            </div>

            {/* Card 4: 30-Day Booking Verdict */}
            <div className="card p-5 sm:p-6 flex flex-col justify-between transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Booking Verdict
                </span>
                <CalendarCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-3">
                <p className="font-mono text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {prediction?.recommendation || "ANALYZE NOW"}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {prediction?.festival_name
                    ? `${prediction.festival_name} (${prediction.holiday_impact_factor})`
                    : "Standard lead-time schedule"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Resilient Alert for 503 LIVE_DATA_UNAVAILABLE or Backend Cold Start */}
        {liveDataUnavailable && (
          <div className="glass border-amber-500/40 bg-amber-500/10 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Live Fares Unavailable from SerpApi (HTTP 503)
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {errorMessage ||
                    "Live Google Flights pricing requires a configured SERPAPI_KEY on the backend server. Per NAPIER integrity rules, prices are never synthesized or estimated."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRetry}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-500/40 bg-white/80 dark:bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-amber-700 dark:text-amber-300 shadow-sm transition hover:bg-amber-500/20 active:scale-95 cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Retry Live Fetch</span>
              </button>

              <a
                href={googleFlightsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700 active:scale-95 cursor-pointer"
              >
                <span>View Google Flights</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Tab 1: Live Analytics & Predictive Forecaster */}
        {activeTab === "live" && (
          <div className="space-y-6">
            {/* Live Carrier Cards */}
            <CarrierCards
              quotes={quotes}
              fetchedAt={prediction?.fetched_at}
              routeCode={routeCode}
            />

            {/* Fare Spread Bar Chart & AI Forecaster Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FareChart quotes={quotes} routeCode={routeCode} />

              {prediction ? (
                <ForecastPanel prediction={prediction} />
              ) : (
                <div className="glass p-8 flex flex-col items-center justify-center text-center h-full min-h-[320px]">
                  <Plane className="h-12 w-12 text-slate-400 mb-3 opacity-50" />
                  <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                    Predictive Demand Engine Standby
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
                    Route demand projections and festival multipliers will render once a route
                    prediction response is received.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Historic Trends & Archive */}
        {activeTab === "history" && <HistoricTrends route={routeCode} />}
      </main>

      {/* AI Assistant Drawer */}
      <AssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        origin={origin}
        destination={destination}
        departureDate={departureDate}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/60 dark:border-slate-800/60 py-8">
        <div className="wrap flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-500" />
            <span>
              NAPIER v2.0 · Strict Data Integrity · Never Synthesises Fares
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/rkrworks/Napier"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-500 transition"
            >
              GitHub (rkrworks/Napier)
            </a>
            <span>•</span>
            <a
              href="https://napier-backend.onrender.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-500 transition"
            >
              API Swagger Docs
            </a>
            <span>•</span>
            <span>© {new Date().getFullYear()} NAPIER</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
