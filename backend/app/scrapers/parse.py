"""Pure helpers (no network, no third-party imports): Google Flights links + SerpApi parsing."""
import re
from typing import Any
from urllib.parse import quote


def extract_numeric_price(val: Any) -> int | None:
    """Extract a positive integer price from int, float, or currency string (e.g. '₹5,400', '5,400', 5400)."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return int(round(val)) if val > 0 else None
    if isinstance(val, str):
        cleaned = re.sub(r"[^\d.]", "", val)
        if cleaned:
            try:
                num = float(cleaned)
                return int(round(num)) if num > 0 else None
            except ValueError:
                return None
    return None


def extract_price_insights(payload: dict[str, Any]) -> dict[str, Any]:
    """Extract Google Flights price level, lowest price, and typical range."""
    insights = payload.get("price_insights") or {}
    lowest = extract_numeric_price(insights.get("lowest_price"))
    level = insights.get("price_level")
    typical_range = insights.get("typical_price_range")
    return {
        "lowest_price": lowest,
        "price_level": level,
        "typical_price_range": typical_range,
    }


def build_google_flights_url(
    origin: str,
    destination: str,
    date: str,
    airline: str | None = None,
    booking_token: str | None = None,
    departure_token: str | None = None,
    gl: str = "in",
) -> str:
    """One-way Google Flights results for a route/date, optionally narrowed to a carrier or exact token."""
    gl_param = f"&gl={quote(gl)}" if gl else ""
    if booking_token:
        return f"https://www.google.com/travel/flights?booking_token={quote(str(booking_token))}&curr=INR&hl=en{gl_param}"
    if departure_token:
        return f"https://www.google.com/travel/flights?departure_token={quote(str(departure_token))}&curr=INR&hl=en{gl_param}"
    query = f"One way flights from {origin.upper()} to {destination.upper()} on {date}"
    if airline:
        query += f" on {airline}"
    return f"https://www.google.com/travel/flights?q={quote(query)}&curr=INR&hl=en&tt=o{gl_param}"


def parse_serpapi_flights(
    payload: dict[str, Any],
    origin: str,
    destination: str,
    date: str,
    gl: str = "in",
) -> list[dict]:
    """Cheapest itinerary per carrier, in SerpApi's own order (best flights first)."""
    itineraries = (payload.get("best_flights") or []) + (payload.get("other_flights") or [])
    per_carrier: dict[str, dict] = {}
    for it in itineraries:
        price = extract_numeric_price(it.get("price")) or extract_numeric_price(it.get("extracted_price"))
        if not price and it.get("booking_options"):
            for opt in it["booking_options"]:
                opt_p = extract_numeric_price(opt.get("price")) or extract_numeric_price(opt.get("extracted_price"))
                if opt_p:
                    price = opt_p if not price else min(price, opt_p)

        legs = it.get("flights") or []
        if not price or not legs:
            continue
        first, last = legs[0], legs[-1]
        name = first.get("airline") or it.get("airline") or "Carrier"
        code = (first.get("flight_number") or "").split(" ")[0] or name[:2].upper()
        stops = max(len(legs) - 1, 0)
        is_connecting = stops > 0
        operating_carriers = [leg.get("airline") for leg in legs if leg.get("airline")]

        booking_token = it.get("booking_token")
        departure_token = it.get("departure_token")
        direct_link = it.get("link") or it.get("google_flights_url")

        if direct_link and ("google.com/travel/flights" in direct_link or "google.com" in direct_link):
            booking_url = direct_link
            if "gl=" not in booking_url:
                booking_url += f"&gl={gl}"
            if "curr=" not in booking_url:
                booking_url += "&curr=INR"
        else:
            booking_url = build_google_flights_url(
                origin,
                destination,
                date,
                airline=name,
                booking_token=booking_token,
                departure_token=departure_token,
                gl=gl,
            )

        quote_ = {
            "name": name,
            "code": code,
            "price": int(price),
            "stops": stops,
            "duration_min": it.get("total_duration") or it.get("duration"),
            "departure_time": (first.get("departure_airport") or {}).get("time"),
            "arrival_time": (last.get("arrival_airport") or {}).get("time"),
            "booking_url": booking_url,
            "is_connecting": is_connecting,
            "operating_carriers": operating_carriers,
        }
        current = per_carrier.get(name)
        if current is None or quote_["price"] < current["price"]:
            per_carrier[name] = quote_
    return list(per_carrier.values())
