from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status


class CommonAPITests(APITestCase):
    def test_health_check_endpoint(self):
        url = reverse('health-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data.get('status'), 'healthy')
        self.assertEqual(data.get('database'), 'connected')
        self.assertEqual(data.get('service'), 'spotter-hos-api')
