/**
 * NAPIER v2.0 - High-Precision Telemetry Formatting Helpers
 */

export const inr = (n: number | null | undefined): string => {
  if (n === null || n === undefined || isNaN(n)) return "₹—";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

export function duration(min: number | null | undefined): string {
  if (!min || isNaN(min)) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

export const stopsLabel = (stops: number, isConnecting?: boolean): string => {
  if (stops === 0 && !isConnecting) return "Non-stop";
  if (stops === 0 && isConnecting) return "Connecting (Direct code)";
  return `${stops} stop${stops > 1 ? "s" : ""}`;
};

/**
 * Returns YYYY-MM-DD formatted date offset by N days from current time.
 */
export function isoDate(offsetDays = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats ISO timestamp to HH:MM (24-hour) with timezone abbreviation.
 */
export function formatFetchedAt(isoStr?: string): string {
  if (!isoStr) return "Fares fetched live";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "Fares fetched live";
    const timeStr = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `Fares fetched at ${timeStr} (${tzName})`;
  } catch {
    return "Fares fetched live";
  }
}

/**
 * Formats departure or arrival flight time strings.
 */
export function formatFlightTime(timeStr: string | null): string {
  if (!timeStr) return "—";
  if (timeStr.includes("T")) {
    return timeStr.split("T")[1].slice(0, 5);
  }
  if (timeStr.includes(" ")) {
    return timeStr.split(" ")[1].slice(0, 5);
  }
  return timeStr.slice(0, 5);
}
