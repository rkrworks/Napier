"""Pure helpers (no network, no third-party imports): Google Flights links + SerpApi parsing."""
from typing import Any
from urllib.parse import quote


def build_google_flights_url(
    origin: str,
    destination: str,
    date: str,
    airline: str | None = None,
    booking_token: str | None = None,
    departure_token: str | None = None,
) -> str:
    """One-way Google Flights results for a route/date, optionally narrowed to a carrier or exact token."""
    if booking_token:
        return f"https://www.google.com/travel/flights?booking_token={quote(str(booking_token))}&curr=INR&hl=en"
    if departure_token:
        return f"https://www.google.com/travel/flights?departure_token={quote(str(departure_token))}&curr=INR&hl=en"
    query = f"One way flights from {origin.upper()} to {destination.upper()} on {date}"
    if airline:
        query += f" on {airline}"
    return f"https://www.google.com/travel/flights?q={quote(query)}&curr=INR&hl=en&tt=o"


def parse_serpapi_flights(payload: dict[str, Any], origin: str, destination: str, date: str) -> list[dict]:
    """Cheapest itinerary per carrier, in SerpApi's own order (best flights first)."""
    itineraries = (payload.get("best_flights") or []) + (payload.get("other_flights") or [])
    per_carrier: dict[str, dict] = {}
    for it in itineraries:
        price = it.get("price")
        legs = it.get("flights") or []
        if not price or not legs:
            continue
        first, last = legs[0], legs[-1]
        name = first.get("airline") or "Carrier"
        code = (first.get("flight_number") or "").split(" ")[0] or name[:2].upper()
        stops = max(len(legs) - 1, 0)
        is_connecting = stops > 0
        operating_carriers = [leg.get("airline") for leg in legs if leg.get("airline")]
        booking_url = build_google_flights_url(
            origin,
            destination,
            date,
            airline=name,
            booking_token=it.get("booking_token"),
            departure_token=it.get("departure_token"),
        )
        quote_ = {
            "name": name,
            "code": code,
            "price": int(price),
            "stops": stops,
            "duration_min": it.get("total_duration"),
            "departure_time": (first.get("departure_airport") or {}).get("time"),
            "arrival_time": (last.get("arrival_airport") or {}).get("time"),
            "booking_url": booking_url,
            "is_connecting": is_connecting,
            "operating_carriers": operating_carriers,
        }
        current = per_carrier.get(name)
        if current is None or quote_["price"] < current["price"]:
            per_carrier[name] = quote_  # replacing a key keeps its original position
    return list(per_carrier.values())
