try:
    import pytest
except ImportError:
    class DummyMark:
        @staticmethod
        def anyio(fn):
            return fn
    class DummyPytest:
        mark = DummyMark()
    pytest = DummyPytest()
import httpx
from unittest.mock import AsyncMock, patch

from app.core.config import settings
from app.core.cache import fare_cache
from app.scrapers.serpapi import fetch_live_quotes

SAMPLE_SERPAPI_RESPONSE = {
    "best_flights": [
        {
            "price": 5400,
            "total_duration": 130,
            "flights": [
                {
                    "airline": "Air India",
                    "flight_number": "AI 805",
                    "departure_airport": {"time": "2026-11-20 07:00"},
                    "arrival_airport": {"time": "2026-11-20 09:10"},
                }
            ],
            "booking_token": "TEST_TOKEN_XYZ",
        }
    ]
}


@pytest.mark.anyio
async def test_serpapi_sends_gl_parameter_and_caches_region(monkeypatch):
    monkeypatch.setattr(settings, "SERPAPI_KEY", "test-key-123")
    monkeypatch.setattr(settings, "SERPAPI_GL", "in")

    captured_params = {}
    captured_cache_set = {}

    # Mock httpx AsyncClient.get
    mock_resp = httpx.Response(
        status_code=200,
        json=SAMPLE_SERPAPI_RESPONSE,
        request=httpx.Request("GET", "https://serpapi.com/search.json"),
    )

    original_get = httpx.AsyncClient.get

    async def fake_get(self, url, *args, **kwargs):
        captured_params.update(kwargs.get("params", {}))
        return mock_resp

    async def fake_cache_get(key):
        return None

    async def fake_cache_set(key, val):
        captured_cache_set["key"] = key
        captured_cache_set["val"] = val

    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)
    monkeypatch.setattr(fare_cache, "get", fake_cache_get)
    monkeypatch.setattr(fare_cache, "set", fake_cache_set)

    quotes, dep_date, fetched_at = await fetch_live_quotes("DEL", "BOM", "2026-11-20")

    # 1. Verify gl parameter is sent and matches config
    assert captured_params["gl"] == "in"
    assert captured_params["currency"] == "INR"
    assert captured_params["hl"] == "en"
    assert captured_params["api_key"] == "test-key-123"

    # 2. Verify cache key includes region
    expected_cache_key = "fares:in:DEL-BOM:2026-11-20"
    assert captured_cache_set.get("key") == expected_cache_key

    # 3. Verify fetched_at is present in response and cached payload
    assert fetched_at is not None
    assert "T" in fetched_at  # ISO-8601
    assert captured_cache_set["val"]["fetched_at"] == fetched_at
    assert captured_cache_set["val"]["quotes"] == quotes


@pytest.mark.anyio
async def test_serpapi_configurable_gl(monkeypatch):
    monkeypatch.setattr(settings, "SERPAPI_KEY", "test-key-123")
    monkeypatch.setattr(settings, "SERPAPI_GL", "uk")

    captured_params = {}
    mock_resp = httpx.Response(
        status_code=200,
        json=SAMPLE_SERPAPI_RESPONSE,
        request=httpx.Request("GET", "https://serpapi.com/search.json"),
    )

    async def fake_get(self, url, *args, **kwargs):
        captured_params.update(kwargs.get("params", {}))
        return mock_resp

    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)
    monkeypatch.setattr(fare_cache, "get", AsyncMock(return_value=None))
    monkeypatch.setattr(fare_cache, "set", AsyncMock())

    await fetch_live_quotes("DEL", "LHR", "2026-11-20")
    assert captured_params["gl"] == "uk"
