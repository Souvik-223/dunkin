from datetime import datetime, timezone
from django.test import SimpleTestCase
from apps.trips.services.hos_engine import HOSEngine
from apps.trips.services.eld_generator import ELDLogGenerator


class ELDLogGeneratorTests(SimpleTestCase):
    def setUp(self):
        self.start_time = datetime(2026, 9, 12, 6, 0, tzinfo=timezone.utc)
        self.origin = {"lat": 41.8781, "lng": -87.6298, "display_name": "Chicago, IL"}
        self.pickup = {"lat": 38.6270, "lng": -90.1994, "display_name": "St. Louis, MO"}
        self.dropoff = {"lat": 34.0522, "lng": -118.2437, "display_name": "Los Angeles, CA"}
        self.generator = ELDLogGenerator()

    def test_daily_sheets_total_exactly_24_hours(self):
        """Verifies every generated daily log sheet sums to exactly 24.0 hours."""
        engine = HOSEngine(current_cycle_used_hours=15.0, start_time=self.start_time)
        # Cross-country haul: 300 mi leg 1, 1800 mi leg 2 -> spans across 3+ days
        leg1 = {"distance_miles": 300.0, "duration_hours": 5.5, "coordinates": [[41.87, -87.62], [38.62, -90.19]]}
        leg2 = {"distance_miles": 1800.0, "duration_hours": 32.7, "coordinates": [[38.62, -90.19], [34.05, -118.24]]}

        result = engine.plan_trip(self.origin, self.pickup, self.dropoff, leg1, leg2)
        sheets = self.generator.generate_log_sheets(
            events=result["events"],
            from_location=self.origin["display_name"],
            to_location=self.dropoff["display_name"],
            initial_cycle_used=15.0
        )

        self.assertGreaterEqual(len(sheets), 2)

        for sheet in sheets:
            totals = sheet["grid_data"]["totals"]
            sum_hours = round(
                totals["off_duty_hours"] +
                totals["sleeper_berth_hours"] +
                totals["driving_hours"] +
                totals["on_duty_not_driving_hours"],
                1
            )
            self.assertEqual(sum_hours, 24.0, f"Day {sheet['day_number']} does not total 24.0 hours (got {sum_hours})")
            self.assertEqual(totals["total_hours"], 24.0)

    def test_recap_cycle_arithmetic(self):
        """Verifies 70-hour rolling recap arithmetic."""
        engine = HOSEngine(current_cycle_used_hours=20.0, start_time=self.start_time)
        leg1 = {"distance_miles": 150.0, "duration_hours": 2.7, "coordinates": [[41.87, -87.62], [38.62, -90.19]]}
        leg2 = {"distance_miles": 150.0, "duration_hours": 2.7, "coordinates": [[38.62, -90.19], [34.05, -118.24]]}

        result = engine.plan_trip(self.origin, self.pickup, self.dropoff, leg1, leg2)
        sheets = self.generator.generate_log_sheets(
            events=result["events"],
            from_location=self.origin["display_name"],
            to_location=self.dropoff["display_name"],
            initial_cycle_used=20.0
        )

        day1_recap = sheets[0]["recap"]
        self.assertEqual(day1_recap["cycle_limit"], 70.0)
        expected_total = round(20.0 + day1_recap["on_duty_hours_today"], 2)
        self.assertEqual(day1_recap["total_hours_last_7_days_including_today"], expected_total)
        self.assertEqual(day1_recap["total_hours_available_tomorrow"], round(70.0 - expected_total, 2))
