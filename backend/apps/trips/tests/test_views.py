from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status


class TripsAPITests(APITestCase):
    def test_presets_endpoint(self):
        url = reverse('trips:trip-presets')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertGreaterEqual(len(data.get("data", [])), 2)

    def test_plan_trip_endpoint_success(self):
        url = reverse('trips:trip-plan')
        payload = {
            "current_location": "Chicago, IL",
            "pickup_location": "St. Louis, MO",
            "dropoff_location": "Dallas, TX",
            "current_cycle_used_hours": 12.5
        }
        response = self.client.post(url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get("success"))

        trip_data = data["data"]
        # Verify required outputs
        self.assertIn("route", trip_data)
        self.assertIn("stops", trip_data)
        self.assertIn("summary", trip_data)
        self.assertIn("log_sheets", trip_data)
        self.assertGreaterEqual(len(trip_data["log_sheets"]), 1)

    def test_plan_trip_validation_error_on_missing_fields(self):
        url = reverse('trips:trip-plan')
        payload = {
            "current_location": "Chicago, IL",
            # Missing pickup and dropoff
        }
        response = self.client.post(url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertFalse(data.get("success"))

    def test_plan_trip_validation_error_on_excessive_cycle(self):
        url = reverse('trips:trip-plan')
        payload = {
            "current_location": "Chicago, IL",
            "pickup_location": "St. Louis, MO",
            "dropoff_location": "Dallas, TX",
            "current_cycle_used_hours": 75.0  # Max is 70.0
        }
        response = self.client.post(url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_history_detail_and_delete_lifecycle(self):
        # 1. Plan a trip
        plan_url = reverse('trips:trip-plan')
        payload = {
            "current_location": "Chicago, IL",
            "pickup_location": "St. Louis, MO",
            "dropoff_location": "Dallas, TX",
            "current_cycle_used_hours": 10.0
        }
        plan_res = self.client.post(plan_url, data=payload, format='json')
        self.assertEqual(plan_res.status_code, status.HTTP_200_OK)
        trip_id = plan_res.json()["data"]["trip_id"]
        self.assertIsNotNone(trip_id)

        # 2. Get history list
        history_url = reverse('trips:trip-history')
        history_res = self.client.get(history_url)
        self.assertEqual(history_res.status_code, status.HTTP_200_OK)
        history_items = history_res.json()["data"]
        self.assertGreaterEqual(len(history_items), 1)
        self.assertEqual(history_items[0]["id"], trip_id)
        self.assertIn("created_at", history_items[0])

        # 3. Get single trip detail
        detail_url = reverse('trips:trip-detail', kwargs={'trip_id': trip_id})
        detail_res = self.client.get(detail_url)
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertIn("route", detail_res.json()["data"])

        # 4. Delete trip
        del_res = self.client.delete(detail_url)
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)

        # 5. Verify 404 after deletion
        check_res = self.client.get(detail_url)
        self.assertEqual(check_res.status_code, status.HTTP_404_NOT_FOUND)

