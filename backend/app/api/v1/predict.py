import re

from fastapi import APIRouter, HTTPException, Path, Query

from app.ml.forecaster import forecaster
from app.scrapers.parse import build_google_flights_url
from app.scrapers.serpapi import fetch_live_quotes

router = APIRouter()
IATA = r"^[A-Za-z]{3}$"


def _check_date(value: str | None) -> str | None:
    if value and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise HTTPException(status_code=422, detail="date must be YYYY-MM-DD")
    return value


@router.get("/predict/{origin}/{destination}")
async def get_price_prediction(
    origin: str = Path(pattern=IATA),
    destination: str = Path(pattern=IATA),
    date: str | None = Query(None, description="Departure date, YYYY-MM-DD (default: today + 14 days)"),
):
    """Live one-way fares for the route + a holiday-demand projection anchored on the cheapest live fare."""
    if origin.upper() == destination.upper():
        raise HTTPException(status_code=422, detail="origin and destination must differ")
    try:
        live_res = await fetch_live_quotes(origin, destination, _check_date(date))
        quotes = live_res[0]
        dep_date = live_res[1]
        fetched_at = live_res[2] if len(live_res) > 2 else None
        canonical_url = getattr(live_res, "canonical_url", None)
        price_insights = getattr(live_res, "price_insights", {})
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    min_quote_price = min(q["price"] for q in quotes)
    if price_insights and price_insights.get("lowest_price") and price_insights["lowest_price"] > 0:
        base_price = min(min_quote_price, price_insights["lowest_price"])
    else:
        base_price = min_quote_price

    result = forecaster.predict_route_fare(origin, destination, current_live_base=base_price)
    result["live_carrier_quotes"] = quotes
    result["departure_date"] = dep_date
    result["google_flights_url"] = canonical_url or build_google_flights_url(origin, destination, dep_date)
    result["fetched_at"] = fetched_at or result.get("generated_at")
    result["price_insights"] = price_insights
    return result
