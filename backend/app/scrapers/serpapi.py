"""Live one-way fares from SerpApi's Google Flights engine, cached 30-60 min. No synthetic fallback."""
from datetime import date as date_cls, datetime, timedelta, timezone

import httpx

from app.core.cache import fare_cache
from app.core.config import settings
from app.scrapers.parse import build_google_flights_url, extract_price_insights, parse_serpapi_flights

SERPAPI_URL = "https://serpapi.com/search.json"


class LiveDataUnavailable(Exception):
    """Raised when real fares cannot be obtained. Callers surface this; they never invent prices."""

    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


class LiveQuotesResult(tuple):
    """Tuple subclass preserving (quotes, departure_date, fetched_at) with canonical_url & price_insights."""

    def __new__(
        cls,
        quotes: list[dict],
        departure_date: str,
        fetched_at: str,
        canonical_url: str | None = None,
        price_insights: dict | None = None,
    ):
        instance = super().__new__(cls, (quotes, departure_date, fetched_at))
        instance.canonical_url = canonical_url
        instance.price_insights = price_insights or {}
        return instance


def default_departure_date() -> str:
    return (datetime.now(timezone.utc) + timedelta(days=14)).strftime("%Y-%m-%d")


def validate_departure_date(value: str | None) -> str:
    if not value:
        return default_departure_date()
    try:
        parsed = date_cls.fromisoformat(value)
    except ValueError as exc:
        raise ValueError("date must be YYYY-MM-DD") from exc
    if parsed < datetime.now(timezone.utc).date():
        raise ValueError("date is in the past")
    return value


async def fetch_live_quotes(
    origin: str,
    destination: str,
    departure_date: str | None = None,
) -> LiveQuotesResult:
    """Return (carrier quotes, departure_date, fetched_at) with exact Google Flights alignment.

    Raises LiveDataUnavailable if no real data.
    """
    origin, destination = origin.upper(), destination.upper()
    departure_date = validate_departure_date(departure_date)
    gl = settings.SERPAPI_GL
    key = f"fares:{gl}:{origin}-{destination}:{departure_date}"

    cached = await fare_cache.get(key)
    if cached:
        if isinstance(cached, dict) and "quotes" in cached:
            return LiveQuotesResult(
                cached["quotes"],
                departure_date,
                cached.get("fetched_at", datetime.now(timezone.utc).isoformat()),
                cached.get("canonical_url"),
                cached.get("price_insights"),
            )
        return LiveQuotesResult(cached, departure_date, datetime.now(timezone.utc).isoformat())

    if not settings.SERPAPI_KEY:
        raise LiveDataUnavailable("SERPAPI_KEY is not configured on the backend.")

    params = {
        "engine": "google_flights",
        "departure_id": origin,
        "arrival_id": destination,
        "outbound_date": departure_date,
        "type": "2",  # SerpApi: 1 = round trip, 2 = one way
        "currency": "INR",
        "hl": "en",
        "gl": gl,
        "api_key": settings.SERPAPI_KEY,
    }
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(SERPAPI_URL, params=params)
    except httpx.HTTPError as exc:
        raise LiveDataUnavailable(f"SerpApi request failed: {exc.__class__.__name__}") from exc

    if resp.status_code != 200:
        raise LiveDataUnavailable(f"SerpApi returned HTTP {resp.status_code}.")
    payload = resp.json()
    if payload.get("error"):
        raise LiveDataUnavailable(f"SerpApi: {payload['error']}")

    canonical_url = (
        payload.get("search_metadata", {}).get("google_flights_url")
        or build_google_flights_url(origin, destination, departure_date, gl=gl)
    )
    price_insights = extract_price_insights(payload)

    quotes = parse_serpapi_flights(payload, origin, destination, departure_date, gl=gl)
    if not quotes:
        raise LiveDataUnavailable(f"No flights found for {origin} → {destination} on {departure_date}.")

    fetched_at = datetime.now(timezone.utc).isoformat()
    cached_payload = {
        "quotes": quotes,
        "fetched_at": fetched_at,
        "canonical_url": canonical_url,
        "price_insights": price_insights,
    }
    await fare_cache.set(key, cached_payload)
    return LiveQuotesResult(quotes, departure_date, fetched_at, canonical_url, price_insights)
