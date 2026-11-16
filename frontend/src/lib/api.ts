/**
 * NAPIER v2.0 - Core API Client & Telemetry Data Contracts
 */

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== "") {
    return process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("vercel.app") || host.includes("github.io")) {
      return "https://napier-backend.onrender.com";
    }
  }
  return "http://localhost:8000";
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface AirportItem {
  iata: string;
  city: string;
  name: string;
  country: string;
}

export const STATIC_AIRPORTS: AirportItem[] = [
  { iata: "DEL", city: "Delhi", name: "Indira Gandhi International Airport", country: "IN" },
  { iata: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj International Airport", country: "IN" },
  { iata: "BLR", city: "Bengaluru", name: "Kempegowda International Airport", country: "IN" },
  { iata: "HYD", city: "Hyderabad", name: "Rajiv Gandhi International Airport", country: "IN" },
  { iata: "MAA", city: "Chennai", name: "Chennai International Airport", country: "IN" },
  { iata: "CCU", city: "Kolkata", name: "Netaji Subhash Chandra Bose International Airport", country: "IN" },
  { iata: "GOI", city: "Goa (Dabolim)", name: "Dabolim Airport", country: "IN" },
  { iata: "PNQ", city: "Pune", name: "Pune Airport", country: "IN" },
  { iata: "AMD", city: "Ahmedabad", name: "Sardar Vallabhbhai Patel International Airport", country: "IN" },
  { iata: "COK", city: "Kochi", name: "Cochin International Airport", country: "IN" },
  { iata: "JAI", city: "Jaipur", name: "Jaipur International Airport", country: "IN" },
  { iata: "LKO", city: "Lucknow", name: "Chaudhary Charan Singh International Airport", country: "IN" },
  { iata: "GAU", city: "Guwahati", name: "Lokpriya Gopinath Bordoloi International Airport", country: "IN" },
  { iata: "IXC", city: "Chandigarh", name: "Shaheed Bhagat Singh International Airport", country: "IN" },
  { iata: "BBI", city: "Bhubaneswar", name: "Biju Patnaik International Airport", country: "IN" },
  { iata: "TRV", city: "Thiruvananthapuram", name: "Trivandrum International Airport", country: "IN" },
  { iata: "VNS", city: "Varanasi", name: "Lal Bahadur Shastri International Airport", country: "IN" },
  { iata: "PAT", city: "Patna", name: "Jay Prakash Narayan International Airport", country: "IN" },
  { iata: "IDR", city: "Indore", name: "Devi Ahilyabai Holkar Airport", country: "IN" },
  { iata: "NAG", city: "Nagpur", name: "Dr. Babasaheb Ambedkar International Airport", country: "IN" },
];

export interface CarrierQuote {
  name: string;
  code: string;
  price: number;
  stops: number;
  duration_min: number | null;
  departure_time: string | null;
  arrival_time: string | null;
  booking_url: string;
  is_connecting?: boolean;
  operating_carriers?: string[];
}

export interface MLPrediction {
  origin: string;
  destination: string;
  route_code: string;
  base_fare: number;
  predicted_price_1h: number;
  predicted_price_24h: number;
  predicted_price_7d: number;
  confidence_corridors: Record<"1h" | "24h" | "7d", { lower: number; upper: number }>;
  holiday_impact_factor: string;
  holiday_impact_pct: number;
  festival_name: string | null;
  recommendation: string;
  advice_text: string;
  status_badge: string;
  generated_at: string;
  live_carrier_quotes: CarrierQuote[];
  departure_date: string;
  google_flights_url: string;
  fetched_at?: string;
}

export interface ResolvedRoute {
  origin: string;
  destination: string;
  origin_city: string;
  destination_city: string;
}

export interface IndexPoint {
  calculation_date: string;
  route_code?: string;
  lead_time_days?: number;
  jevons_index_value: number;
  avg_base_fare: number;
  avg_total_fare?: number;
  mom_change_pct?: number;
  sample_count: number;
}

export interface ChatResponse {
  markdown_advice: string;
  status_badge: string;
  recommendation: string;
  suggested_queries: string[];
  carrier_links: CarrierQuote[];
  ml_summary?: {
    predicted_price_1h: number;
    predicted_price_24h: number;
    predicted_price_7d: number;
    holiday_impact_factor: string;
    confidence_corridors: Record<string, { lower: number; upper: number }>;
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Cannot connect to NAPIER telemetry engine. Please ensure the backend server is running.",
      0,
      "NETWORK"
    );
  }

  if (!res.ok) {
    let message = `Request failed (HTTP ${res.status})`;
    let code: string | undefined;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (data?.detail?.message) {
        message = data.detail.message;
        code = data.detail.code;
      }
    } catch {
      /* non-JSON payload */
    }
    throw new ApiError(message, res.status, code);
  }

  return (await res.json()) as T;
}

export async function resolveRoute(query: string): Promise<ResolvedRoute> {
  return request<ResolvedRoute>(`/api/v1/resolve?q=${encodeURIComponent(query)}`);
}

export async function fetchAirports(query: string): Promise<AirportItem[]> {
  const clean = query.trim().toLowerCase();
  if (!clean) return STATIC_AIRPORTS.slice(0, 8);

  try {
    const res = await request<{ results: { iata: string; city: string; country: string }[] }>(
      `/api/v1/airports?q=${encodeURIComponent(clean)}`
    );
    if (res?.results && res.results.length > 0) {
      return res.results.map((r) => {
        const found = STATIC_AIRPORTS.find((s) => s.iata === r.iata);
        return {
          iata: r.iata,
          city: r.city,
          country: r.country,
          name: found ? found.name : `${r.city} Airport`,
        };
      });
    }
  } catch {
    /* fallback to local static airport directory */
  }

  return STATIC_AIRPORTS.filter(
    (a) =>
      a.iata.toLowerCase().includes(clean) ||
      a.city.toLowerCase().includes(clean) ||
      a.name.toLowerCase().includes(clean)
  ).slice(0, 8);
}

export async function fetchRoutePrediction(
  origin: string,
  destination: string,
  date?: string
): Promise<MLPrediction> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return request<MLPrediction>(`/api/v1/predict/${origin.toUpperCase()}/${destination.toUpperCase()}${query}`);
}

export async function fetchIndexTrends(
  route: string,
  leadTime: number
): Promise<{ route: string; lead_time_days: number; total_datapoints: number; data: IndexPoint[] }> {
  return request<{ route: string; lead_time_days: number; total_datapoints: number; data: IndexPoint[] }>(
    `/api/v1/index-trends?route=${encodeURIComponent(route)}&lead_time=${leadTime}`
  );
}

export async function sendAssistantChat(payload: {
  message: string;
  origin: string;
  destination: string;
  date?: string;
}): Promise<ChatResponse> {
  return request<ChatResponse>("/api/v1/assistant/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
