from typing import Dict, Any, Optional
from datetime import datetime
from infrastructure.maps.geocoding import GeocodingService
from infrastructure.maps.routing import RoutingService
from infrastructure.maps.places import PlacesService
from .hos_engine import HOSEngine
from .eld_generator import ELDLogGenerator
from ..models import Trip


class TripPlannerService:
    """
    Coordinates geocoding, multi-stop route calculation, FMCSA HOS compliance,
    real commercial truck stop discovery, and ELD daily log sheet generation.
    """

    def __init__(
        self,
        geocoding_service: Optional[GeocodingService] = None,
        routing_service: Optional[RoutingService] = None,
        places_service: Optional[PlacesService] = None,
    ):
        self.geocoder = geocoding_service or GeocodingService()
        self.router = routing_service or RoutingService()
        self.places = places_service or PlacesService()
        self.log_generator = ELDLogGenerator()

    def plan_and_save_trip(
        self,
        current_location_query: str,
        pickup_location_query: str,
        dropoff_location_query: str,
        current_cycle_used_hours: float = 0.0,
        start_time: Optional[datetime] = None,
        driver_name: str = "John Doe / Driver #1",
        carrier_name: str = "Spotter Freight Logistics",
        truck_tractor_no: str = "TRK-9842 / TRL-4412"
    ) -> Dict[str, Any]:
        # 1. Geocode all 3 required locations
        origin = self.geocoder.geocode(current_location_query)
        pickup = self.geocoder.geocode(pickup_location_query)
        dropoff = self.geocoder.geocode(dropoff_location_query)

        # 2. Get realistic road routes for Leg 1 and Leg 2
        leg1_route = self.router.get_route([(origin['lat'], origin['lng']), (pickup['lat'], pickup['lng'])])
        leg2_route = self.router.get_route([(pickup['lat'], pickup['lng']), (dropoff['lat'], dropoff['lng'])])

        # Combine coordinates for full Leaflet route geometry (only drivable road coordinates)
        full_route_coordinates = []
        if leg1_route.get('has_route', True):
            full_route_coordinates.extend(leg1_route.get('coordinates', []))
        if leg1_route.get('has_route', True) and leg2_route.get('has_route', True):
            full_route_coordinates.extend(leg2_route.get('coordinates', []))

        leg1_miles = leg1_route['distance_miles'] if leg1_route.get('has_route', True) else 0.0
        leg2_miles = leg2_route['distance_miles'] if (leg1_route.get('has_route', True) and leg2_route.get('has_route', True)) else 0.0
        total_road_distance = round(leg1_miles + leg2_miles, 1)

        # 3. Simulate FMCSA Hours of Service with Real Places
        hos_engine = HOSEngine(
            current_cycle_used_hours=current_cycle_used_hours,
            start_time=start_time,
            places_service=self.places
        )
        hos_result = hos_engine.plan_trip(
            origin=origin,
            pickup=pickup,
            dropoff=dropoff,
            leg1_route=leg1_route,
            leg2_route=leg2_route
        )

        # 4. Generate Multi-day ELD 24-hour log sheets
        log_sheets = self.log_generator.generate_log_sheets(
            events=hos_result['events'],
            driver_name=driver_name,
            carrier_name=carrier_name,
            truck_tractor_no=truck_tractor_no,
            from_location=origin['display_name'],
            to_location=dropoff['display_name'],
            initial_cycle_used=current_cycle_used_hours
        )

        # Serialize stops for API response with Real Place attributes
        serialized_stops = []
        for s in hos_result['stops']:
            serialized_stops.append({
                "stop_type": s.stop_type,
                "location_name": s.location_name,
                "coordinates": [s.coordinates[0], s.coordinates[1]],
                "arrival_time": s.arrival_time.isoformat(),
                "departure_time": s.departure_time.isoformat(),
                "duration_hours": round(s.duration_hours, 2),
                "description": s.description,
                "miles_from_start": s.miles_from_start,
                "address": s.address,
                "city": s.city,
                "state": s.state,
                "zip_code": s.zip_code,
                "rating": s.rating,
                "user_ratings_total": s.user_ratings_total,
                "photo_url": s.photo_url,
                "amenities": s.amenities,
                "brand": s.brand,
                "google_maps_url": s.google_maps_url,
            })

        response_payload = {
            "locations": {
                "origin": origin,
                "pickup": pickup,
                "dropoff": dropoff
            },
            "route": {
                "total_distance_miles": total_road_distance,
                "coordinates": full_route_coordinates,
                "has_breakpoint": hos_result['summary'].get('has_breakpoint', False),
                "breakpoint_location": hos_result['summary'].get('breakpoint_location'),
                "breakpoint_message": hos_result['summary'].get('breakpoint_message'),
                "legs": [
                    {
                        "name": "Current Location to Pickup",
                        "from": origin['display_name'],
                        "to": pickup['display_name'],
                        "distance_miles": leg1_route['distance_miles'],
                        "duration_hours": leg1_route['duration_hours'],
                        "has_route": leg1_route.get('has_route', True)
                    },
                    {
                        "name": "Pickup to Dropoff",
                        "from": pickup['display_name'],
                        "to": dropoff['display_name'],
                        "distance_miles": leg2_route['distance_miles'],
                        "duration_hours": leg2_route['duration_hours'],
                        "has_route": leg2_route.get('has_route', True)
                    }
                ]
            },
            "stops": serialized_stops,
            "summary": hos_result['summary'],
            "log_sheets": log_sheets
        }

        # 5. Persist to DB for history/audit
        try:
            trip_record = Trip.objects.create(
                current_location=origin['display_name'],
                pickup_location=pickup['display_name'],
                dropoff_location=dropoff['display_name'],
                current_cycle_used_hours=current_cycle_used_hours,
                total_distance_miles=total_road_distance,
                total_duration_hours=hos_result['summary']['total_duration_hours'],
                total_driving_hours=hos_result['summary']['total_driving_hours'],
                days_count=len(log_sheets),
                result_payload=response_payload
            )
            response_payload["trip_id"] = trip_record.id
        except Exception:
            # Fallback if DB write fails
            response_payload["trip_id"] = None

        return response_payload
