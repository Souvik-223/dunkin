from datetime import datetime, timezone
from django.test import SimpleTestCase
from apps.trips.services.hos_engine import HOSEngine


class HOSEngineTests(SimpleTestCase):
    def setUp(self):
        self.start_time = datetime(2026, 9, 12, 6, 0, tzinfo=timezone.utc)
        self.origin = {"lat": 41.8781, "lng": -87.6298, "display_name": "Chicago, IL"}
        self.pickup = {"lat": 38.6270, "lng": -90.1994, "display_name": "St. Louis, MO"}
        self.dropoff = {"lat": 34.0522, "lng": -118.2437, "display_name": "Los Angeles, CA"}

    def test_terminal_pickup_and_dropoff_durations(self):
        """Verifies 1 hour on-duty loading at pickup and 1 hour unloading at dropoff."""
        engine = HOSEngine(current_cycle_used_hours=10.0, start_time=self.start_time)
        leg1 = {"distance_miles": 100.0, "duration_hours": 1.8, "coordinates": [[41.87, -87.62], [38.62, -90.19]]}
        leg2 = {"distance_miles": 100.0, "duration_hours": 1.8, "coordinates": [[38.62, -90.19], [34.05, -118.24]]}

        result = engine.plan_trip(self.origin, self.pickup, self.dropoff, leg1, leg2)
        stops = result["stops"]

        pickup_stops = [s for s in stops if s.stop_type == "PICKUP"]
        dropoff_stops = [s for s in stops if s.stop_type == "DROPOFF"]

        self.assertEqual(len(pickup_stops), 1)
        self.assertEqual(pickup_stops[0].duration_hours, 1.0)
        self.assertEqual(len(dropoff_stops), 1)
        self.assertEqual(dropoff_stops[0].duration_hours, 1.0)

    def test_30_minute_break_triggered_after_8h_driving(self):
        """Verifies 30-minute mandatory rest break after 8 hours of driving."""
        engine = HOSEngine(current_cycle_used_hours=0.0, start_time=self.start_time)
        # 550 miles at 55 mph = 10 hours driving, which must trigger 30-min break after 8h
        leg1 = {"distance_miles": 550.0, "duration_hours": 10.0, "coordinates": [[41.87, -87.62], [38.62, -90.19]]}
        leg2 = {"distance_miles": 50.0, "duration_hours": 0.9, "coordinates": [[38.62, -90.19], [34.05, -118.24]]}

        result = engine.plan_trip(self.origin, self.pickup, self.dropoff, leg1, leg2)
        break_stops = [s for s in result["stops"] if s.stop_type == "REST_30M"]
        self.assertGreaterEqual(len(break_stops), 1)
        self.assertEqual(break_stops[0].duration_hours, 0.5)

    def test_10_hour_rest_triggered_when_driving_hits_11_hours(self):
        """Verifies 10-hour consecutive rest break is inserted when shift reaches 11 hours driving."""
        engine = HOSEngine(current_cycle_used_hours=0.0, start_time=self.start_time)
        # 800 miles at 55 mph = 14.5 hours driving -> must trigger 10-hour rest
        leg1 = {"distance_miles": 800.0, "duration_hours": 14.5, "coordinates": [[41.87, -87.62], [38.62, -90.19]]}
        leg2 = {"distance_miles": 50.0, "duration_hours": 0.9, "coordinates": [[38.62, -90.19], [34.05, -118.24]]}

        result = engine.plan_trip(self.origin, self.pickup, self.dropoff, leg1, leg2)
        daily_rests = [s for s in result["stops"] if s.stop_type == "REST_10H"]
        self.assertGreaterEqual(len(daily_rests), 1)
        self.assertEqual(daily_rests[0].duration_hours, 10.0)

    def test_fueling_at_least_once_every_1000_miles(self):
        """Verifies mandatory fueling stop is scheduled within 1,000 miles."""
        engine = HOSEngine(current_cycle_used_hours=0.0, start_time=self.start_time)
        leg1 = {"distance_miles": 1200.0, "duration_hours": 21.8, "coordinates": [[41.87, -87.62], [38.62, -90.19]]}
        leg2 = {"distance_miles": 100.0, "duration_hours": 1.8, "coordinates": [[38.62, -90.19], [34.05, -118.24]]}

        result = engine.plan_trip(self.origin, self.pickup, self.dropoff, leg1, leg2)
        fuel_stops = [s for s in result["stops"] if s.stop_type == "FUEL"]
        self.assertGreaterEqual(len(fuel_stops), 1)
        # First fuel stop must be at or before 1000 miles
        self.assertLessEqual(fuel_stops[0].miles_from_start, 1000.5)
