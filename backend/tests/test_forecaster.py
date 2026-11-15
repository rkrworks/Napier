import datetime
from app.ml.forecaster import HolidayFeatureTransformer, PriceForecaster


def test_2027_festival_lookup_not_2026_only():
    """Verify 2027 festival calculations identify 2027 festivals rather than falling back to 2026 dates."""
    transformer = HolidayFeatureTransformer()

    # Diwali in 2027 is October 29, 2027.
    # Under 2026-only data (where Diwali is 2026-11-08), the distance would be 355 days.
    diwali_2027 = datetime.date(2027, 10, 29)
    features_on_day = transformer.get_holiday_features(diwali_2027)

    assert features_on_day["days_to_closest_festival"] == 0
    assert "Diwali" in features_on_day["festival_name"]
    # Must fail if calculated against 2026-only data
    assert features_on_day["days_to_closest_festival"] < 10

    # 2 days before Diwali 2027
    two_days_before = datetime.date(2027, 10, 27)
    features_near = transformer.get_holiday_features(two_days_before)
    assert features_near["days_to_closest_festival"] == 2
    assert features_near["festival_name"] is not None
    assert "Diwali" in features_near["festival_name"]
    assert features_near["impact_factor_pct"] >= 18.4


def test_2027_new_year_and_christmas():
    transformer = HolidayFeatureTransformer()
    xmas_2027 = datetime.date(2027, 12, 25)
    f_xmas = transformer.get_holiday_features(xmas_2027)
    assert f_xmas["days_to_closest_festival"] == 0
    assert "Christmas" in f_xmas["festival_name"]

    ny_2027 = datetime.date(2027, 1, 1)
    f_ny = transformer.get_holiday_features(ny_2027)
    assert f_ny["days_to_closest_festival"] == 0
    assert "New Year" in f_ny["festival_name"]


def test_forecaster_route_fare_2027():
    forecaster = PriceForecaster()
    res = forecaster.predict_route_fare("DEL", "BOM", current_live_base=5000.0)
    assert res["base_fare"] == 5000.0
    assert res["predicted_price_1h"] > 0
    assert res["predicted_price_24h"] > 0
    assert res["predicted_price_7d"] > 0
