from urllib.parse import parse_qs, urlparse

from app.scrapers.parse import (
    build_google_flights_url,
    extract_numeric_price,
    extract_price_insights,
    parse_serpapi_flights,
)

PAYLOAD = {
    "best_flights": [
        {
            "price": 5200,
            "total_duration": 135,
            "flights": [
                {
                    "airline": "IndiGo",
                    "flight_number": "6E 2041",
                    "departure_airport": {"time": "2026-11-20 06:00"},
                    "arrival_airport": {"time": "2026-11-20 08:15"},
                }
            ],
        },
    ],
    "other_flights": [
        {
            "price": 4900,
            "total_duration": 300,
            "flights": [
                {"airline": "IndiGo", "flight_number": "6E 100"},
                {
                    "airline": "IndiGo",
                    "flight_number": "6E 200",
                    "arrival_airport": {"time": "2026-11-20 14:00"},
                },
            ],
        },
        {"price": 0, "flights": [{"airline": "Ghost", "flight_number": "XX 1"}]},
        {"price": 6100, "flights": []},
    ],
}


def test_url_is_one_way_and_carrier_scoped():
    url = build_google_flights_url("del", "bom", "2026-11-20", "Air India")
    qs = parse_qs(urlparse(url).query)
    assert qs["tt"] == ["o"]
    assert "One way flights from DEL to BOM on 2026-11-20 on Air India" in qs["q"][0]
    assert qs["gl"] == ["in"]
    assert qs["curr"] == ["INR"]


def test_parse_keeps_cheapest_per_carrier_and_skips_invalid():
    quotes = parse_serpapi_flights(PAYLOAD, "DEL", "BOM", "2026-11-20")
    assert [q["name"] for q in quotes] == ["IndiGo"]
    assert quotes[0]["price"] == 4900 and quotes[0]["stops"] == 1 and quotes[0]["code"] == "6E"
    assert "tt=o" in quotes[0]["booking_url"]
    assert quotes[0]["is_connecting"] is True
    assert quotes[0]["operating_carriers"] == ["IndiGo", "IndiGo"]


def test_parse_connecting_and_direct_itineraries():
    payload = {
        "best_flights": [
            {
                "price": 5000,
                "total_duration": 120,
                "flights": [
                    {
                        "airline": "Air India",
                        "flight_number": "AI 101",
                        "departure_airport": {"time": "08:00"},
                        "arrival_airport": {"time": "10:00"},
                    }
                ],
            },
            {
                "price": 4500,
                "total_duration": 280,
                "flights": [
                    {"airline": "SpiceJet", "flight_number": "SG 201"},
                    {
                        "airline": "IndiGo",
                        "flight_number": "6E 302",
                        "arrival_airport": {"time": "14:40"},
                    },
                ],
                "booking_token": "TOK_BOOK_123",
            },
        ]
    }
    quotes = parse_serpapi_flights(payload, "DEL", "BOM", "2026-11-20")
    by_name = {q["name"]: q for q in quotes}

    # Air India is direct
    assert by_name["Air India"]["is_connecting"] is False
    assert by_name["Air India"]["stops"] == 0
    assert by_name["Air India"]["operating_carriers"] == ["Air India"]
    assert "q=" in by_name["Air India"]["booking_url"]

    # SpiceJet first leg is connecting with IndiGo
    assert by_name["SpiceJet"]["is_connecting"] is True
    assert by_name["SpiceJet"]["stops"] == 1
    assert by_name["SpiceJet"]["operating_carriers"] == ["SpiceJet", "IndiGo"]
    assert "booking_token=TOK_BOOK_123" in by_name["SpiceJet"]["booking_url"]


def test_departure_token_in_booking_url():
    payload = {
        "best_flights": [
            {
                "price": 4200,
                "flights": [{"airline": "Vistara", "flight_number": "UK 801"}],
                "departure_token": "DEP_TOK_456",
            }
        ]
    }
    quotes = parse_serpapi_flights(payload, "DEL", "BOM", "2026-11-20")
    assert "departure_token=DEP_TOK_456" in quotes[0]["booking_url"]


def test_parse_empty_payload():
    assert parse_serpapi_flights({}, "DEL", "BOM", "2026-11-20") == []


def test_extract_numeric_price():
    assert extract_numeric_price(5400) == 5400
    assert extract_numeric_price(5400.0) == 5400
    assert extract_numeric_price("₹5,400") == 5400
    assert extract_numeric_price("5,400") == 5400
    assert extract_numeric_price("₹ 4,890.50") == 4890
    assert extract_numeric_price(0) is None
    assert extract_numeric_price(None) is None
    assert extract_numeric_price("N/A") is None


def test_parse_serpapi_formatted_price_and_extracted_price():
    payload = {
        "best_flights": [
            {
                "price": "₹4,890",
                "flights": [{"airline": "Akasa Air", "flight_number": "QP 1302"}],
            },
            {
                "price": None,
                "extracted_price": 5100,
                "flights": [{"airline": "IndiGo", "flight_number": "6E 502"}],
            },
        ],
        "price_insights": {
            "lowest_price": "₹4,890",
            "price_level": "low",
            "typical_price_range": [4500, 6200],
        },
    }
    quotes = parse_serpapi_flights(payload, "DEL", "BOM", "2026-11-20")
    by_name = {q["name"]: q for q in quotes}
    assert by_name["Akasa Air"]["price"] == 4890
    assert by_name["IndiGo"]["price"] == 5100

    insights = extract_price_insights(payload)
    assert insights["lowest_price"] == 4890
    assert insights["price_level"] == "low"
