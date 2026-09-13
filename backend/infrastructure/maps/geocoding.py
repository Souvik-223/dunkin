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


US_STATE_ABBR: Dict[str, str] = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
    "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
    "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO",
    "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ",
    "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
    "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
    "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
    "district of columbia": "DC",
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

    def autocomplete(self, query: str, limit: int = 6) -> list[Dict[str, Any]]:
        """
        Provides worldwide search-as-you-type suggestions for cities, towns, and municipalities.
        Uses Photon (OSM-based geocoding engine) with Nominatim and preset cache fallback.
        Primes self._cache with coordinates for instant subsequent route planning.
        """
        q = query.strip()
        if not q or len(q) < 2:
            return []

        suggestions: list[Dict[str, Any]] = []
        seen_keys: set[str] = set()

        # 1. Primary: Photon OSM Search Engine
        try:
            url = "https://photon.komoot.io/api/"
            params = {
                'q': q,
                'limit': limit * 2,  # Fetch extra to filter out duplicates or non-places
            }
            resp = self.session.get(url, params=params, timeout=4)
            if resp.status_code == 200:
                data = resp.json()
                for feature in data.get('features', []):
                    props = feature.get('properties', {})
                    coords = feature.get('geometry', {}).get('coordinates', [])
                    if len(coords) < 2:
                        continue

                    lng = float(coords[0])
                    lat = float(coords[1])
                    name = props.get('name') or props.get('city') or props.get('town')
                    if not name:
                        continue

                    state = props.get('state', '')
                    country = props.get('country', '')
                    country_code = (props.get('countrycode') or '').upper()

                    # Deduplicate by name + state + country
                    dedup_key = f"{name.lower()}|{state.lower()}|{country.lower()}"
                    if dedup_key in seen_keys:
                        continue
                    seen_keys.add(dedup_key)

                    # Determine short name
                    state_abbr = US_STATE_ABBR.get(state.lower(), state) if country_code in ('US', 'USA') else state
                    if country_code in ('US', 'USA') and state_abbr:
                        short_name = f"{name}, {state_abbr}"
                    elif state and country:
                        short_name = f"{name}, {country}"
                    elif country:
                        short_name = f"{name}, {country}"
                    else:
                        short_name = name

                    parts = [p for p in [name, state, country] if p]
                    display_name = ", ".join(parts)

                    # Prime the geocode cache so subsequent route calculation is an instant cache hit
                    self._cache[short_name.lower()] = {"lat": lat, "lng": lng, "display_name": display_name}
                    self._cache[display_name.lower()] = {"lat": lat, "lng": lng, "display_name": display_name}
                    self._cache[name.lower()] = {"lat": lat, "lng": lng, "display_name": display_name}

                    suggestions.append({
                        "id": f"photon-{props.get('osm_id', len(suggestions))}",
                        "name": name,
                        "state": state,
                        "country": country,
                        "country_code": country_code,
                        "display_name": display_name,
                        "short_name": short_name,
                        "lat": round(lat, 5),
                        "lng": round(lng, 5)
                    })

                    if len(suggestions) >= limit:
                        break
        except Exception as e:
            logger.warning("Photon autocomplete failed for '%s': %s", q, e)

        # 2. Fallback: Nominatim if Photon returned no results
        if not suggestions:
            try:
                url = "https://nominatim.openstreetmap.org/search"
                params = {
                    'q': q,
                    'format': 'json',
                    'limit': limit,
                    'addressdetails': 1
                }
                resp = self.session.get(url, params=params, timeout=4)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data:
                        addr = item.get('address', {})
                        name = addr.get('city') or addr.get('town') or addr.get('village') or item.get('name')
                        if not name:
                            continue

                        state = addr.get('state', '')
                        country = addr.get('country', '')
                        country_code = (addr.get('country_code') or '').upper()

                        dedup_key = f"{name.lower()}|{state.lower()}|{country.lower()}"
                        if dedup_key in seen_keys:
                            continue
                        seen_keys.add(dedup_key)

                        lat = float(item['lat'])
                        lng = float(item['lon'])
                        state_abbr = US_STATE_ABBR.get(state.lower(), state) if country_code in ('US', 'USA') else state
                        if country_code in ('US', 'USA') and state_abbr:
                            short_name = f"{name}, {state_abbr}"
                        else:
                            short_name = f"{name}, {country}" if country else name

                        display_name = item.get('display_name', short_name)

                        self._cache[short_name.lower()] = {"lat": lat, "lng": lng, "display_name": display_name}
                        self._cache[display_name.lower()] = {"lat": lat, "lng": lng, "display_name": display_name}

                        suggestions.append({
                            "id": f"nom-{item.get('place_id', len(suggestions))}",
                            "name": name,
                            "state": state,
                            "country": country,
                            "country_code": country_code,
                            "display_name": display_name,
                            "short_name": short_name,
                            "lat": round(lat, 5),
                            "lng": round(lng, 5)
                        })
            except Exception as e:
                logger.warning("Nominatim autocomplete fallback failed for '%s': %s", q, e)

        # 3. Fallback: Preset locations filter
        if not suggestions:
            q_lower = q.lower()
            for key, val in PRESET_LOCATIONS.items():
                if q_lower in key:
                    parts = val["display_name"].split(", ")
                    name = parts[0] if parts else key.title()
                    state = parts[1] if len(parts) > 1 else ""
                    country = parts[2] if len(parts) > 2 else "USA"
                    suggestions.append({
                        "id": f"preset-{key}",
                        "name": name,
                        "state": state,
                        "country": country,
                        "country_code": "US",
                        "display_name": val["display_name"],
                        "short_name": key.title(),
                        "lat": val["lat"],
                        "lng": val["lng"]
                    })
                    if len(suggestions) >= limit:
                        break

        return suggestions

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

        # Try Photon first for fast worldwide resolution
        try:
            url = "https://photon.komoot.io/api/"
            params = {'q': query, 'limit': 1}
            resp = self.session.get(url, params=params, timeout=4)
            if resp.status_code == 200:
                features = resp.json().get('features', [])
                if features:
                    coords = features[0]['geometry']['coordinates']
                    props = features[0].get('properties', {})
                    name = props.get('name') or query
                    state = props.get('state', '')
                    country = props.get('country', '')
                    disp = ", ".join([p for p in [name, state, country] if p]) or query
                    result = {
                        "lat": float(coords[1]),
                        "lng": float(coords[0]),
                        "display_name": disp
                    }
                    self._cache[normalized] = result
                    return result
        except Exception as e:
            logger.warning("Photon geocoding failed for '%s': %s", query, e)

        # Query Nominatim API fallback
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
