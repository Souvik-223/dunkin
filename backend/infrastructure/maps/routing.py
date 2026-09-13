import math
import logging
import requests
from typing import List, Tuple, Dict, Any, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


def haversine_distance_miles(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Computes great-circle distance between two (lat, lng) tuples in miles.
    """
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    radius_earth_miles = 3958.8

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return radius_earth_miles * c


class RoutingService:
    """
    Adapter for querying driving routes, geometry polyline, distances, and travel durations.
    Uses OSRM public routing engine with fallback to geodesic calculation.
    """

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or getattr(settings, 'OSRM_BASE_URL', 'https://router.project-osrm.org')).rstrip('/')
        self.session = requests.Session()

    def get_route(
        self,
        waypoints: List[Tuple[float, float]]
    ) -> Dict[str, Any]:
        """
        Takes a list of (lat, lng) coordinates and returns:
        {
            "distance_miles": float,
            "duration_hours": float,
            "coordinates": List[[lat, lng]], # GeoJSON format for Leaflet
            "legs": List[Dict]
        }
        """
        if len(waypoints) < 2:
            raise ValueError("At least two waypoints (origin, destination) are required.")

        # OSRM expects coordinates in lng,lat order
        coord_str = ";".join([f"{lng:.5f},{lat:.5f}" for lat, lng in waypoints])
        url = f"{self.base_url}/route/v1/driving/{coord_str}?overview=full&geometries=geojson&steps=true"

        try:
            response = self.session.get(url, timeout=8)
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    # Check waypoint snap distance: if OSRM snapped a point across oceans (>100km), road is disconnected
                    waypoints_data = data.get("waypoints", [])
                    max_snap_dist = max([w.get("distance", 0) for w in waypoints_data], default=0)
                    if max_snap_dist > 100000:
                        logger.warning("OSRM snapped waypoint %s meters away; road network disconnected.", max_snap_dist)
                        return {
                            "has_route": False,
                            "distance_miles": 0.0,
                            "duration_hours": 0.0,
                            "coordinates": [],
                            "legs": [],
                            "source": "osrm_disconnected",
                            "error_code": "NO_ROAD_ROUTE",
                            "message": "No possible road routes available between these points."
                        }

                    route = data["routes"][0]
                    # OSRM distance is in meters, convert to miles
                    distance_miles = round(route["distance"] * 0.000621371, 1)
                    # OSRM duration is in seconds, convert to hours
                    duration_hours = round(route["duration"] / 3600.0, 2)

                    # Geometry coordinates: OSRM gives [lng, lat], convert to [lat, lng] for Leaflet
                    raw_coords = route["geometry"]["coordinates"]
                    leaflet_coords = [[point[1], point[0]] for point in raw_coords]

                    legs = []
                    for leg in route.get("legs", []):
                        legs.append({
                            "distance_miles": round(leg["distance"] * 0.000621371, 1),
                            "duration_hours": round(leg["duration"] / 3600.0, 2),
                            "summary": leg.get("summary", "")
                        })

                    return {
                        "has_route": True,
                        "distance_miles": distance_miles,
                        "duration_hours": duration_hours,
                        "coordinates": leaflet_coords,
                        "legs": legs,
                        "source": "osrm"
                    }
            elif response.status_code == 400:
                data = response.json()
                if data.get("code") == "NoRoute":
                    logger.warning("OSRM reported NoRoute between waypoints: %s", coord_str)
                    return {
                        "has_route": False,
                        "distance_miles": 0.0,
                        "duration_hours": 0.0,
                        "coordinates": [],
                        "legs": [],
                        "source": "osrm_no_route",
                        "error_code": "NO_ROAD_ROUTE",
                        "message": "No possible road routes available between these points."
                    }
        except Exception as e:
            logger.warning("OSRM routing failed: %s", e)

        # Fallback routing calculation
        # NEVER do fallback if distance is intercontinental (>3,000 miles) or separated by ocean
        p1 = waypoints[0]
        p2 = waypoints[-1]
        direct_dist = haversine_distance_miles(p1, p2)
        if direct_dist > 3000:
            logger.warning("Rejecting fallback route across %s miles; intercontinental water barrier.", direct_dist)
            return {
                "has_route": False,
                "distance_miles": 0.0,
                "duration_hours": 0.0,
                "coordinates": [],
                "legs": [],
                "source": "fallback_rejected",
                "error_code": "NO_ROAD_ROUTE",
                "message": "No possible road routes available between these points."
            }

        fallback_data = self._calculate_fallback_route(waypoints)
        fallback_data["has_route"] = True
        return fallback_data

    def _calculate_fallback_route(self, waypoints: List[Tuple[float, float]]) -> Dict[str, Any]:
        """
        Generates simulated road trajectory and distances when external OSRM is offline.
        Uses 1.25 road winding factor over direct Haversine distance, and 55 mph average speed.
        """
        total_miles = 0.0
        route_coords: List[List[float]] = []
        legs = []

        for i in range(len(waypoints) - 1):
            p1 = waypoints[i]
            p2 = waypoints[i + 1]
            direct_dist = haversine_distance_miles(p1, p2)
            road_dist = direct_dist * 1.25  # Road winding adjustment
            leg_duration = road_dist / 55.0  # Average commercial truck highway speed

            total_miles += road_dist
            legs.append({
                "distance_miles": round(road_dist, 1),
                "duration_hours": round(leg_duration, 2),
                "summary": f"Leg {i + 1}"
            })

            # Interpolate 20 points between p1 and p2 for smooth map rendering
            num_steps = max(10, int(road_dist / 25))
            for step in range(num_steps):
                t = step / float(num_steps)
                lat = p1[0] + t * (p2[0] - p1[0])
                lng = p1[1] + t * (p2[1] - p1[1])
                route_coords.append([round(lat, 5), round(lng, 5)])

        route_coords.append([waypoints[-1][0], waypoints[-1][1]])

        return {
            "has_route": True,
            "distance_miles": round(total_miles, 1),
            "duration_hours": round(total_miles / 55.0, 2),
            "coordinates": route_coords,
            "legs": legs,
            "source": "fallback_estimation"
        }
