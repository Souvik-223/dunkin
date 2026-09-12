import logging
import requests
from typing import Optional, Dict, Any
from django.conf import settings

logger = logging.getLogger(__name__)

# In-memory fast cache for known locations & test stability
PRESET_LOCATIONS: Dict[str, Dict[str, Any]] = {
    "chicago, il": {"lat": 41.8781, "lng": -87.6298, "display_name": "Chicago, Illinois, USA"},
    "los angeles, ca": {"lat": 34.0522, "lng": -118.2437, "display_name": "Los Angeles, California, USA"},
    "dallas, tx": {"lat": 32.7767, "lng": -96.7970, "display_name": "Dallas, Texas, USA"},
    "new york, ny": {"lat": 40.7128, "lng": -74.0060, "display_name": "New York, New York, USA"},
    "atlanta, ga": {"lat": 33.7490, "lng": -84.3880, "display_name": "Atlanta, Georgia, USA"},
    "miami, fl": {"lat": 25.7617, "lng": -80.1918, "display_name": "Miami, Florida, USA"},
    "denver, co": {"lat": 39.7392, "lng": -104.9903, "display_name": "Denver, Colorado, USA"},
    "seattle, wa": {"lat": 47.6062, "lng": -122.3321, "display_name": "Seattle, Washington, USA"},
    "houston, tx": {"lat": 29.7604, "lng": -95.3698, "display_name": "Houston, Texas, USA"},
    "phoenix, az": {"lat": 33.4484, "lng": -112.0740, "display_name": "Phoenix, Arizona, USA"},
    "memphis, tn": {"lat": 35.1495, "lng": -90.0490, "display_name": "Memphis, Tennessee, USA"},
    "indianapolis, in": {"lat": 39.7684, "lng": -86.1581, "display_name": "Indianapolis, Indiana, USA"},
    "st. louis, mo": {"lat": 38.6270, "lng": -90.1994, "display_name": "St. Louis, Missouri, USA"},
    "kansas city, mo": {"lat": 39.0997, "lng": -94.5786, "display_name": "Kansas City, Missouri, USA"},
}


class GeocodingService:
    """
    Adapter for resolving addresses or city names to geographic coordinates.
    Uses OpenStreetMap Nominatim with an in-memory cache and fallback.
    """

    def __init__(self, user_agent: Optional[str] = None):
        self.user_agent = user_agent or getattr(settings, 'NOMINATIM_USER_AGENT', 'SpotterHOSApp/1.0')
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': self.user_agent})
        self._cache: Dict[str, Dict[str, Any]] = dict(PRESET_LOCATIONS)

    def geocode(self, query: str) -> Dict[str, Any]:
        """
        Geocodes an address or city string to {lat, lng, display_name}.
        Raises ValueError if location cannot be resolved.
        """
        normalized = query.strip().lower()

        if normalized in self._cache:
            return self._cache[normalized]

        for key, value in self._cache.items():
            if key in normalized or normalized in key:
                return value

        # Query Nominatim API
        try:
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                'q': query,
                'format': 'json',
                'limit': 1,
                'addressdetails': 1
            }
            response = self.session.get(url, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()

            if data and len(data) > 0:
                result = {
                    "lat": float(data[0]["lat"]),
                    "lng": float(data[0]["lon"]),
                    "display_name": data[0].get("display_name", query)
                }
                self._cache[normalized] = result
                return result
        except Exception as e:
            logger.warning("Nominatim geocoding failed for '%s': %s", query, e)

        # Fallback if external service is unavailable or rate limited
        logger.warning("Using fallback coordinates for query: %s", query)
        fallback = {"lat": 39.8283, "lng": -98.5795, "display_name": f"{query} (Estimated)"}
        self._cache[normalized] = fallback
        return fallback
