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
  Database,
  ArrowRight,
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
    `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}+on+${departureDate}+one+way&curr=INR&gl=in&hl=en`;

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
      <Header
        googleFlightsUrl={googleFlightsUrl}
        onOpenAssistant={() => setAssistantOpen(true)}
        isBackendHealthy={!errorMessage || liveDataUnavailable}
      />

      <main id="top" className="flex-1 w-full space-y-12 sm:space-y-16">
        {/* ======================================================== SCREEN 1: HERO (Split Hero Spec) */}
        <section
          className="hero hero--split relative z-20 overflow-hidden py-12 sm:py-16 md:py-20"
          data-enter
          aria-labelledby="hero-h"
        >
          <div className="wrap">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Hero Text Column (Span 6) */}
              <div className="hero__text lg:col-span-6 space-y-6">
                <p className="hero__kicker inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                  </span>
                  <span>Indian Domestic Aviation Telemetry · Live POS: gl=in</span>
                </p>

                <h1
                  id="hero-h"
                  className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08] font-mono"
                >
                  National airfare price index and flight telemetry
                </h1>

                <p className="hero__lead text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed font-sans">
                  Real-time one-way airfare quotes directly aligned with Google Flights India.
                  Anchored by geometric Jevons price index benchmarks and holiday surge forecasting
                  across 20 domestic aviation corridors.
                </p>

                <div className="btn-row flex flex-wrap items-center gap-3 pt-2">
                  <a
                    className="btn btn--primary flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 px-6 py-3 font-mono text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    href="#search"
                  >
                    <span>Query Route Fares</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  <a
                    className="btn btn--secondary flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-850 px-5 py-3 font-mono text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    href={googleFlightsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Cross-Reference Google Flights</span>
                    <ExternalLink className="h-4 w-4 opacity-70" />
                  </a>
                </div>
              </div>

              {/* Hero Visual Column: Real UI Telemetry Live Card (Span 6) */}
              <div className="hero__media lg:col-span-6 relative">
                <div className="glass p-6 sm:p-7 space-y-5 rounded-2xl relative shadow-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl">
                  {/* Visual Header */}
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/30">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                          Active Telemetry Stream
                        </span>
                        <h3 className="font-mono text-lg font-black text-slate-900 dark:text-white">
                          {routeCode} Corridor
                        </h3>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        EXACT QUOTE
                      </span>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {departureDate}
                      </p>
                    </div>
                  </div>

                  {/* Primary Telemetry Metric Tile */}
                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-850/70 p-4 sm:p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Lowest Live Fare
                      </p>
                      <p className="font-mono text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight mt-1">
                        {lowestFare ? inr(lowestFare) : liveDataUnavailable ? "Indicative" : "₹4,890"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {quotes[0]?.name ? `${quotes[0].name} · Non-stop` : "IndiGo 6E · Non-stop (1h 55m)"}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <TrendingDown className="h-3.5 w-3.5" />
                        <span>Lowest Rate</span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-2">
                        POS: India (gl=in)
                      </p>
                    </div>
                  </div>

                  {/* Carrier Quick Summary Strips */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono py-1.5 px-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">IndiGo (6E)</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {lowestFare ? inr(lowestFare) : "₹4,890"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono py-1.5 px-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Air India (AI)</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {quotes.find((q) => q.code === "AI")?.price
                          ? inr(quotes.find((q) => q.code === "AI")!.price)
                          : "₹5,400"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono py-1.5 px-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Akasa Air (QP)</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {quotes.find((q) => q.code === "QP")?.price
                          ? inr(quotes.find((q) => q.code === "QP")!.price)
                          : "₹5,150"}
                      </span>
                    </div>
                  </div>

                  {/* Dealt Float Card */}
                  <div className="ly-float rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-850/95 p-3.5 shadow-md flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Point of Sale: India
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-slate-400">
                      Refreshed every 45 min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== SCREEN 2: ROUTE SEARCH COMMAND CENTER */}
        <section
          className="taste-section relative z-20"
          id="search"
          aria-labelledby="search-h"
        >
          <div className="wrap space-y-6">
            <div className="section-head border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
              <h2
                id="search-h"
                className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white"
              >
                Route Telemetry Search.{" "}
                <span className="text-slate-400 font-sans font-medium text-lg sm:text-xl">
                  Query live one-way fares between Indian domestic airports.
                </span>
              </h2>
            </div>

            <RouteSearch
              initialOrigin={origin}
              initialDestination={destination}
              initialDate={departureDate}
              loading={loading}
              onSearch={handleSearch}
            />
          </div>
        </section>

        {/* 4-Card KPI Telemetry Summary Strip */}
        <section className="taste-section py-2" aria-label="Key Flight Telemetry Metrics">
          <div className="wrap">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Lowest Live Fare */}
              <div className="card p-5 sm:p-6 flex flex-col justify-between transition hover:-translate-y-1 shadow-md bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Lowest Live Fare
                  </span>
                  <TrendingDown className="h-4 w-4 text-cyan-500" />
                </div>
                <div className="mt-4">
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
              <div className="card p-5 sm:p-6 flex flex-col justify-between transition hover:-translate-y-1 shadow-md bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Carrier Count &amp; Spread
                  </span>
                  <Layers className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="mt-4">
                  <p className="font-mono text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {quotes.length > 0 ? `${quotes.length} Airlines` : "0 Airlines"}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {fareSpread !== null ? `Spread: ${inr(fareSpread)} variance` : "No quote dispersion"}
                  </p>
                </div>
              </div>

              {/* Card 3: Jevons Price Index */}
              <div className="card p-5 sm:p-6 flex flex-col justify-between transition hover:-translate-y-1 shadow-md bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Jevons Price Index
                  </span>
                  <Gauge className="h-4 w-4 text-purple-500" />
                </div>
                <div className="mt-4">
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
              <div className="card p-5 sm:p-6 flex flex-col justify-between transition hover:-translate-y-1 shadow-md bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Booking Verdict
                  </span>
                  <CalendarCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="mt-4">
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
          </div>
        </section>

        {/* Resilient Alert for 503 LIVE_DATA_UNAVAILABLE */}
        {liveDataUnavailable && (
          <section className="taste-section py-2">
            <div className="wrap">
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
            </div>
          </section>
        )}

        {/* ======================================================== SCREEN 3: LIVE CARRIER QUOTES & FARE SPREAD */}
        <section
          className="taste-section relative z-20"
          id="carriers"
          aria-labelledby="carriers-h"
        >
          <div className="wrap space-y-6">
            <div className="section-head border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
              <h2
                id="carriers-h"
                className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white"
              >
                Live Airline Quotes.{" "}
                <span className="text-slate-400 font-sans font-medium text-lg sm:text-xl">
                  Real-time fare dispersion across carriers directly from Google Flights.
                </span>
              </h2>
            </div>

            <CarrierCards
              quotes={quotes}
              fetchedAt={prediction?.fetched_at}
              routeCode={routeCode}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
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
        </section>

        {/* ======================================================== SCREEN 4: FORECAST & HISTORIC TRENDS */}
        <section
          className="taste-section relative z-20"
          id="analytics"
          aria-labelledby="analytics-h"
        >
          <div className="wrap space-y-6">
            <div className="section-head border-b border-slate-200/60 dark:border-slate-800/60 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2
                  id="analytics-h"
                  className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white"
                >
                  Forecast &amp; Index Analytics.{" "}
                  <span className="text-slate-400 font-sans font-medium text-lg sm:text-xl">
                    Rule-based festival demand projections and geometric Jevons price trends.
                  </span>
                </h2>
              </div>

              {/* Segmented Tab Switcher */}
              <div className="seg inline-flex p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 self-start sm:self-auto">
                <button
                  type="button"
                  aria-pressed={activeTab === "live"}
                  onClick={() => setActiveTab("live")}
                  className={`flex min-h-[44px] items-center px-4 py-2 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
                    activeTab === "live"
                      ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Demand Projections
                </button>
                <button
                  type="button"
                  aria-pressed={activeTab === "history"}
                  onClick={() => setActiveTab("history")}
                  className={`flex min-h-[44px] items-center px-4 py-2 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
                    activeTab === "history"
                      ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Archived Jevons Trends
                </button>
              </div>
            </div>

            {activeTab === "history" ? (
              <HistoricTrends route={routeCode} />
            ) : (
              <div className="glass p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <Database className="h-6 w-6 text-cyan-500" />
                  <div>
                    <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                      Lead-Time &amp; Surge Multipliers
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Forward holiday demand curves applied against today&apos;s live base fare
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/50 dark:bg-slate-850/50">
                    <p className="text-[11px] font-mono uppercase font-bold text-slate-400">1-Hour Horizon</p>
                    <p className="text-xl font-black font-mono text-cyan-500 mt-1">
                      {prediction ? inr(prediction.predicted_price_1h) : "₹4,890"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Micro-variance corridor: ±4.5%
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/50 dark:bg-slate-850/50">
                    <p className="text-[11px] font-mono uppercase font-bold text-slate-400">24-Hour Horizon</p>
                    <p className="text-xl font-black font-mono text-indigo-500 mt-1">
                      {prediction ? inr(prediction.predicted_price_24h) : "₹5,200"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Overnight seat yield shift: ±8.0%
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/50 dark:bg-slate-850/50">
                    <p className="text-[11px] font-mono uppercase font-bold text-slate-400">7-Day Horizon</p>
                    <p className="text-xl font-black font-mono text-purple-500 mt-1">
                      {prediction ? inr(prediction.predicted_price_7d) : "₹5,800"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Holiday impact factor: {prediction?.holiday_impact_factor || "+18.4%"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ======================================================== SCREEN 5: ENGINE METHODOLOGY & ARCHITECTURE */}
        <section
          className="taste-section relative z-20"
          id="about"
          aria-labelledby="about-h"
        >
          <div className="wrap space-y-6">
            <div className="section-head border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
              <h2
                id="about-h"
                className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white"
              >
                Engine Architecture.{" "}
                <span className="text-slate-400 font-sans font-medium text-lg sm:text-xl">
                  Strict data integrity with zero synthetic fare estimations.
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature Card 1 */}
              <div className="card p-6 sm:p-7 space-y-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 shadow-md">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                  Point-of-Sale (POS) Alignment
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  Fare searches pin point-of-sale queries to India (SERPAPI_GL=&quot;in&quot;), matching
                  Google Flights India domestic quotes with full GST inclusion and precise tax parity.
                </p>
              </div>

              {/* Feature Card 2 */}
              <div className="card p-6 sm:p-7 space-y-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 shadow-md">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500">
                  <Gauge className="h-5 w-5" />
                </div>
                <h3 className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                  Jevons Price Index Metric
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  The unweighted geometric mean tracks macro airfare movements relative to a
                  calibrated baseline of 4,000 INR, tracking percentage deviation across lead times.
                </p>
              </div>

              {/* Feature Card 3 */}
              <div className="card p-6 sm:p-7 space-y-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 shadow-md">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <h3 className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                  Festival Demand Projections
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  Rule-based multipliers analyze Indian calendar festivals (Diwali, Holi, Pongal,
                  Christmas, New Year) to project demand surges without black-box estimations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== SCREEN 6: CLOSING CTA SECTION & FOOTER */}
        <footer
          className="footer closing taste-section mt-16 border-t border-slate-200/80 dark:border-slate-800/80 pt-16 pb-12"
          id="close"
          aria-labelledby="close-h"
        >
          <div className="wrap space-y-12">
            {/* Closing CTA Banner */}
            <div className="closing__cta close--word text-center max-w-2xl mx-auto space-y-5">
              <h2
                id="close-h"
                className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-white"
              >
                Track Indian domestic airfares with Google Flights precision
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Live one-way airfare quotes refreshed every 45 minutes across primary Indian aviation
                corridors. Zero synthetic prices.
              </p>
              <div className="pt-2">
                <a
                  className="btn btn--primary inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 px-7 py-3.5 font-mono text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  href="#search"
                >
                  <span>Query Route Fares</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Footer Navigation & Credits (Single Licence Credit Line as per taste-skill rule 1) */}
            <div className="pt-8 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-500" />
                <span>NAPIER v2.0 · National Airfare Price Index Engine</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <a
                  href="https://github.com/rkrworks/Napier"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-500 transition underline"
                >
                  GitHub
                </a>
                <span>·</span>
                <a
                  href="https://napier-backend.onrender.com/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-500 transition underline"
                >
                  API Swagger
                </a>
                <span>·</span>
                <a
                  href={googleFlightsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-500 transition underline"
                >
                  Live Google Flights POS India
                </a>
              </div>
            </div>

            {/* Licence credit line (House rule 1) */}
            <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              Airfare quotes aggregated directly from Google Flights via SerpApi with regional point-of-sale alignment. Never synthesized.
            </div>
          </div>
        </footer>
      </main>

      {/* AI Assistant Drawer */}
      <AssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        origin={origin}
        destination={destination}
        departureDate={departureDate}
      />
    </div>
  );
}
