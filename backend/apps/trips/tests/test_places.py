from django.test import SimpleTestCase
from infrastructure.maps.places import PlacesService, MAJOR_US_TRUCK_STOPS, haversine_distance_miles


class PlacesServiceTests(SimpleTestCase):
    def setUp(self):
        self.service = PlacesService()

    def test_curated_truck_stop_matching(self):
        """Verifies that coordinates near York, NE match Love's Travel Stop #654."""
        # Near York, NE: lat 40.85, lng -97.55
        target = (40.85, -97.55)
        facility = self.service.find_best_stop_facility(
            target_coords=target,
            stop_type='REST_30M',
            miles_from_start=500.0,
            max_corridor_radius_miles=50.0
        )

        self.assertTrue(facility["is_curated"])
        self.assertIn("Love's", facility["location_name"])
        self.assertEqual(facility["city"], "York")
        self.assertEqual(facility["state"], "NE")
        self.assertGreater(facility["rating"], 4.0)
        self.assertGreaterEqual(len(facility["amenities"]), 3)
        self.assertTrue(facility["google_maps_url"].startswith("https://www.google.com/maps/search/?api=1"))
        self.assertTrue(facility["photo_url"].startswith("https://"))

    def test_haversine_distance_calculation(self):
        """Verifies distance calculation accuracy between two known coordinates."""
        chicago = (41.8781, -87.6298)
        st_louis = (38.6270, -90.1994)
        dist = haversine_distance_miles(chicago, st_louis)
        # Direct distance is approximately 260 miles
        self.assertGreater(dist, 240.0)
        self.assertLess(dist, 280.0)

    def test_stop_attributes_present(self):
        """Verifies all required stop attributes are present in returned dictionary."""
        target = (35.20, -101.80)  # Near Amarillo, TX
        facility = self.service.find_best_stop_facility(
            target_coords=target,
            stop_type='REST_10H',
            miles_from_start=1100.0
        )

        required_keys = [
            "location_name", "coordinates", "address", "city", "state",
            "rating", "user_ratings_total", "photo_url", "amenities",
            "brand", "google_maps_url"
        ]
        for key in required_keys:
            self.assertIn(key, facility)
            self.assertIsNotNone(facility[key])
