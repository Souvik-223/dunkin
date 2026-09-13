import math
import urllib.parse
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from infrastructure.maps.places import PlacesService


@dataclass
class DutyEvent:
    """
    Represents a continuous segment of driver status:
    status: 'OFF_DUTY' | 'SLEEPER_BERTH' | 'DRIVING' | 'ON_DUTY_NOT_DRIVING'
    """
    status: str
    start_time: datetime
    end_time: datetime
    duration_hours: float
    location_name: str
    activity_description: str
    distance_miles: float = 0.0
    start_coordinates: Optional[Tuple[float, float]] = None
    end_coordinates: Optional[Tuple[float, float]] = None


@dataclass
class TripStop:
    """
    Represents an operational or compliance stop along the route.
    """
    stop_type: str  # 'START' | 'PICKUP' | 'DROPOFF' | 'REST_30M' | 'REST_10H' | 'FUEL'
    location_name: str
    coordinates: Tuple[float, float]
    arrival_time: datetime
    departure_time: datetime
    duration_hours: float
    description: str
    miles_from_start: float
    # Real Place & Verified Facility Fields (100% Free)
    address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    photo_url: Optional[str] = None
    amenities: List[str] = field(default_factory=list)
    brand: Optional[str] = None
    google_maps_url: Optional[str] = None


class HOSEngine:
    """
    FMCSA Hours of Service (HOS) Property-Carrying Driver Simulation Engine (49 CFR § 395).
    Enforces:
    - 11-Hour Maximum Driving Limit per shift
    - 14-Hour Consecutive Duty Window per shift
    - 30-Minute Rest Break after <= 8 cumulative driving hours
    - 10-Hour Consecutive Off-Duty / Sleeper Berth Rest
    - Fueling stops at least once every 1,000 miles (30 min on-duty)
    - 1 hour loading at Pickup and 1 hour unloading at Dropoff
    - 70-Hour / 8-Day rolling cycle tracking
    """

    MAX_DRIVING_SHIFT = 11.0
    MAX_DUTY_WINDOW = 14.0
    MAX_DRIVE_BEFORE_BREAK = 8.0
    BREAK_DURATION = 0.5          # 30 minutes
    DAILY_REST_DURATION = 10.0    # 10 hours
    FUEL_INTERVAL_MILES = 1000.0  # Fuel at least once every 1,000 miles
    FUEL_DURATION = 0.5           # 30 minutes
    TERMINAL_OP_DURATION = 1.0    # 1 hour for pickup and dropoff
    CYCLE_LIMIT = 70.0            # 70 hours in 8 days
    AVERAGE_SPEED_MPH = 55.0      # Average commercial truck speed

    def __init__(
        self,
        current_cycle_used_hours: float = 0.0,
        start_time: Optional[datetime] = None,
        places_service: Optional[PlacesService] = None
    ):
        self.initial_cycle_used = min(max(0.0, current_cycle_used_hours), self.CYCLE_LIMIT)
        if start_time is None:
            # Default to today at 06:00 AM UTC
            now = datetime.now(timezone.utc)
            self.current_time = datetime(now.year, now.month, now.day, 6, 0, tzinfo=timezone.utc)
        else:
            self.current_time = start_time

        self.places = places_service or PlacesService()
        self.events: List[DutyEvent] = []
        self.stops: List[TripStop] = []

        # Shift & Cycle tracking counters
        self.shift_driving_hours = 0.0
        self.shift_duty_window_hours = 0.0
        self.driving_since_break = 0.0
        self.miles_since_fuel = 0.0
        self.total_miles_traveled = 0.0
        self.cycle_used_hours = self.initial_cycle_used

    def plan_trip(
        self,
        origin: Dict[str, Any],
        pickup: Dict[str, Any],
        dropoff: Dict[str, Any],
        leg1_route: Dict[str, Any],
        leg2_route: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Executes full HOS route simulation across:
        1. Origin -> Pickup (Driving + En-route rest/fuel)
        2. Pickup Operation (1 hour On Duty Loading)
        3. Pickup -> Dropoff (Driving + En-route rest/fuel)
        4. Dropoff Operation (1 hour On Duty Unloading)
        """
        origin_coord = (origin['lat'], origin['lng'])
        pickup_coord = (pickup['lat'], pickup['lng'])
        dropoff_coord = (dropoff['lat'], dropoff['lng'])

        # Record Initial Start Stop
        origin_gmap = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote_plus(origin.get('display_name') or 'Origin Terminal')}"
        self.stops.append(TripStop(
            stop_type='START',
            location_name=origin['display_name'],
            coordinates=origin_coord,
            arrival_time=self.current_time,
            departure_time=self.current_time,
            duration_hours=0.0,
            description="Trip departed from starting terminal",
            miles_from_start=0.0,
            address=origin.get('display_name', ''),
            city=origin.get('display_name', '').split(',')[0],
            brand="Origin Terminal",
            google_maps_url=origin_gmap
        ))

        # Check if Leg 1 has a possible road route
        if not leg1_route.get('has_route', True):
            origin_name = origin.get('display_name', 'Origin Terminal')
            self.stops.append(TripStop(
                stop_type='BREAKPOINT',
                location_name=origin_name,
                coordinates=origin_coord,
                arrival_time=self.current_time,
                departure_time=self.current_time,
                duration_hours=0.0,
                description=f'No possible road routes available from "{origin_name}". Road network ends or is separated by ocean/impassable terrain.',
                miles_from_start=0.0,
                address=origin_name,
                city=origin_name.split(',')[0],
                brand="Road Route Breakpoint",
                google_maps_url=origin_gmap
            ))

            # Record off-duty activity so daily log sheets and timetable balance cleanly
            self._record_activity(
                status='OFF_DUTY',
                duration_hours=24.0,
                location_name=origin_name,
                activity_description=f"Route halted: No possible road routes available from {origin_name}"
            )

            start_dt = self.events[0].start_time
            end_dt = self.events[-1].end_time
            total_duration = (end_dt - start_dt).total_seconds() / 3600.0

            return {
                "events": self.events,
                "stops": self.stops,
                "summary": {
                    "total_distance_miles": 0.0,
                    "total_duration_hours": round(total_duration, 2),
                    "total_driving_hours": 0.0,
                    "total_on_duty_hours": 0.0,
                    "total_rest_hours": round(total_duration, 2),
                    "start_time": start_dt.isoformat(),
                    "estimated_arrival": end_dt.isoformat(),
                    "initial_cycle_used_hours": round(self.initial_cycle_used, 2),
                    "final_cycle_used_hours": round(self.cycle_used_hours, 2),
                    "cycle_remaining_hours": max(0.0, round(self.CYCLE_LIMIT - self.cycle_used_hours, 2)),
                    "days_count": 1,
                    "has_breakpoint": True,
                    "breakpoint_location": origin_name,
                    "breakpoint_message": f"No possible road routes available from {origin_name}"
                }
            }

        # Leg 1: Origin -> Pickup (Road route available)
        self._simulate_driving_leg(
            from_name=origin['display_name'],
            to_name=pickup['display_name'],
            from_coord=origin_coord,
            to_coord=pickup_coord,
            leg_distance_miles=leg1_route['distance_miles'],
            leg_coordinates=leg1_route['coordinates']
        )

        # Stop at Pickup: 1 hour On Duty Not Driving
        self._record_activity(
            status='ON_DUTY_NOT_DRIVING',
            duration_hours=self.TERMINAL_OP_DURATION,
            location_name=pickup['display_name'],
            activity_description="Pickup / Loading cargo (1 hr on-duty)"
        )
        pickup_gmap = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote_plus(pickup.get('display_name') or 'Freight Shipper Facility')}"
        self.stops.append(TripStop(
            stop_type='PICKUP',
            location_name=pickup['display_name'],
            coordinates=pickup_coord,
            arrival_time=self.current_time - timedelta(hours=self.TERMINAL_OP_DURATION),
            departure_time=self.current_time,
            duration_hours=self.TERMINAL_OP_DURATION,
            description="Shipper Facility: 1 hour required for loading and manifest verification",
            miles_from_start=round(self.total_miles_traveled, 1),
            address=pickup.get('display_name', ''),
            city=pickup.get('display_name', '').split(',')[0],
            brand="Freight Shipper Facility",
            google_maps_url=pickup_gmap
        ))

        # Check if Leg 2 has a possible road route
        if not leg2_route.get('has_route', True):
            pickup_name = pickup.get('display_name', 'Freight Shipper Facility')
            self.stops.append(TripStop(
                stop_type='BREAKPOINT',
                location_name=pickup_name,
                coordinates=pickup_coord,
                arrival_time=self.current_time,
                departure_time=self.current_time,
                duration_hours=0.0,
                description=f'No possible road routes available from "{pickup_name}". Road network ends or is separated by ocean/impassable terrain.',
                miles_from_start=round(self.total_miles_traveled, 1),
                address=pickup.get('display_name', ''),
                city=pickup.get('display_name', '').split(',')[0],
                brand="Road Route Breakpoint",
                google_maps_url=pickup_gmap
            ))

            self._record_activity(
                status='OFF_DUTY',
                duration_hours=10.0,
                location_name=pickup_name,
                activity_description=f"Route halted at pickup: No possible road routes available from {pickup_name}"
            )

            total_driving = sum(e.duration_hours for e in self.events if e.status == 'DRIVING')
            total_on_duty = sum(e.duration_hours for e in self.events if e.status in ('DRIVING', 'ON_DUTY_NOT_DRIVING'))
            total_rest = sum(e.duration_hours for e in self.events if e.status in ('OFF_DUTY', 'SLEEPER_BERTH'))

            start_dt = self.events[0].start_time
            end_dt = self.events[-1].end_time
            total_duration = (end_dt - start_dt).total_seconds() / 3600.0

            return {
                "events": self.events,
                "stops": self.stops,
                "summary": {
                    "total_distance_miles": round(self.total_miles_traveled, 1),
                    "total_duration_hours": round(total_duration, 2),
                    "total_driving_hours": round(total_driving, 2),
                    "total_on_duty_hours": round(total_on_duty, 2),
                    "total_rest_hours": round(total_rest, 2),
                    "start_time": start_dt.isoformat(),
                    "estimated_arrival": end_dt.isoformat(),
                    "initial_cycle_used_hours": round(self.initial_cycle_used, 2),
                    "final_cycle_used_hours": round(self.cycle_used_hours, 2),
                    "cycle_remaining_hours": max(0.0, round(self.CYCLE_LIMIT - self.cycle_used_hours, 2)),
                    "days_count": max(1, math.ceil((end_dt.date() - start_dt.date()).days + 1)),
                    "has_breakpoint": True,
                    "breakpoint_location": pickup_name,
                    "breakpoint_message": f"No possible road routes available from {pickup_name}"
                }
            }

        # Leg 2: Pickup -> Dropoff (Road route available)
        self._simulate_driving_leg(
            from_name=pickup['display_name'],
            to_name=dropoff['display_name'],
            from_coord=pickup_coord,
            to_coord=dropoff_coord,
            leg_distance_miles=leg2_route['distance_miles'],
            leg_coordinates=leg2_route['coordinates']
        )

        # Stop at Dropoff: 1 hour On Duty Not Driving
        self._record_activity(
            status='ON_DUTY_NOT_DRIVING',
            duration_hours=self.TERMINAL_OP_DURATION,
            location_name=dropoff['display_name'],
            activity_description="Dropoff / Unloading cargo (1 hr on-duty)"
        )
        dropoff_gmap = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote_plus(dropoff.get('display_name') or 'Freight Receiver Terminal')}"
        self.stops.append(TripStop(
            stop_type='DROPOFF',
            location_name=dropoff['display_name'],
            coordinates=dropoff_coord,
            arrival_time=self.current_time - timedelta(hours=self.TERMINAL_OP_DURATION),
            departure_time=self.current_time,
            duration_hours=self.TERMINAL_OP_DURATION,
            description="Receiver Facility: 1 hour required for unloading and bill of lading sign-off",
            miles_from_start=round(self.total_miles_traveled, 1),
            address=dropoff.get('display_name', ''),
            city=dropoff.get('display_name', '').split(',')[0],
            brand="Freight Receiver Terminal",
            google_maps_url=dropoff_gmap
        ))

        total_driving = sum(e.duration_hours for e in self.events if e.status == 'DRIVING')
        total_on_duty = sum(e.duration_hours for e in self.events if e.status in ('DRIVING', 'ON_DUTY_NOT_DRIVING'))
        total_rest = sum(e.duration_hours for e in self.events if e.status in ('OFF_DUTY', 'SLEEPER_BERTH'))

        start_dt = self.events[0].start_time
        end_dt = self.events[-1].end_time
        total_duration = (end_dt - start_dt).total_seconds() / 3600.0

        return {
            "events": self.events,
            "stops": self.stops,
            "summary": {
                "total_distance_miles": round(self.total_miles_traveled, 1),
                "total_duration_hours": round(total_duration, 2),
                "total_driving_hours": round(total_driving, 2),
                "total_on_duty_hours": round(total_on_duty, 2),
                "total_rest_hours": round(total_rest, 2),
                "start_time": start_dt.isoformat(),
                "estimated_arrival": end_dt.isoformat(),
                "initial_cycle_used_hours": round(self.initial_cycle_used, 2),
                "final_cycle_used_hours": round(self.cycle_used_hours, 2),
                "cycle_remaining_hours": max(0.0, round(self.CYCLE_LIMIT - self.cycle_used_hours, 2)),
                "days_count": max(1, math.ceil((end_dt.date() - start_dt.date()).days + 1)),
                "has_breakpoint": False,
                "breakpoint_location": None,
                "breakpoint_message": None
            }
        }

    def _simulate_driving_leg(
        self,
        from_name: str,
        to_name: str,
        from_coord: Tuple[float, float],
        to_coord: Tuple[float, float],
        leg_distance_miles: float,
        leg_coordinates: List[List[float]]
    ):
        """
        Drives along a leg, chunking miles into segments and checking for:
        - 30-minute rest break (every 8h driving)
        - Fuel stop (every 1,000 miles)
        - 10-hour daily rest (11h drive or 14h window)
        """
        remaining_leg_miles = leg_distance_miles
        leg_completed_miles = 0.0

        while remaining_leg_miles > 0.01:
            # 1. Check if 10-Hour Daily Rest is mandatory (11h driving limit or 14h duty window)
            driving_allowable = self.MAX_DRIVING_SHIFT - self.shift_driving_hours
            window_allowable = self.MAX_DUTY_WINDOW - self.shift_duty_window_hours

            if driving_allowable <= 0.05 or window_allowable <= 0.05:
                self._insert_10h_rest(from_name, to_name, leg_coordinates, leg_completed_miles, leg_distance_miles)
                continue

            # 2. Check if 30-Minute Rest Break is mandatory (8h driving since last break)
            drive_until_break = self.MAX_DRIVE_BEFORE_BREAK - self.driving_since_break
            if drive_until_break <= 0.05:
                self._insert_30m_break(from_name, to_name, leg_coordinates, leg_completed_miles, leg_distance_miles)
                continue

            # 3. Check Fueling Limit (1,000 miles since last fuel)
            miles_until_fuel = self.FUEL_INTERVAL_MILES - self.miles_since_fuel
            if miles_until_fuel <= 0.5:
                self._insert_fuel_stop(from_name, to_name, leg_coordinates, leg_completed_miles, leg_distance_miles)
                continue

            # 4. Calculate maximum drivable hours for the current continuous block
            max_drive_hours = min(
                driving_allowable,
                window_allowable,
                drive_until_break,
                remaining_leg_miles / self.AVERAGE_SPEED_MPH,
                miles_until_fuel / self.AVERAGE_SPEED_MPH
            )

            # Minimum progress chunk (at least 0.1 hour unless finishing)
            drive_hours = max(0.05, max_drive_hours)
            miles_driven = min(remaining_leg_miles, drive_hours * self.AVERAGE_SPEED_MPH)
            drive_hours = miles_driven / self.AVERAGE_SPEED_MPH

            start_coords = self._interpolate_coords(leg_coordinates, leg_completed_miles, leg_distance_miles)
            end_coords = self._interpolate_coords(leg_coordinates, leg_completed_miles + miles_driven, leg_distance_miles)

            self.events.append(DutyEvent(
                status='DRIVING',
                start_time=self.current_time,
                end_time=self.current_time + timedelta(hours=drive_hours),
                duration_hours=round(drive_hours, 3),
                location_name=f"En route to {to_name}",
                activity_description=f"Driving {miles_driven:.1f} mi toward {to_name}",
                distance_miles=round(miles_driven, 1),
                start_coordinates=start_coords,
                end_coordinates=end_coords
            ))

            self.current_time += timedelta(hours=drive_hours)
            self.shift_driving_hours += drive_hours
            self.shift_duty_window_hours += drive_hours
            self.driving_since_break += drive_hours
            self.miles_since_fuel += miles_driven
            self.total_miles_traveled += miles_driven
            self.cycle_used_hours += drive_hours
            leg_completed_miles += miles_driven
            remaining_leg_miles -= miles_driven

    def _insert_30m_break(self, from_name, to_name, leg_coords, leg_completed, leg_total):
        break_coord = self._interpolate_coords(leg_coords, leg_completed, leg_total)
        facility = self.places.find_best_stop_facility(
            target_coords=break_coord,
            stop_type='REST_30M',
            miles_from_start=self.total_miles_traveled
        )
        actual_coords = facility["coordinates"]

        self.events.append(DutyEvent(
            status='OFF_DUTY',
            start_time=self.current_time,
            end_time=self.current_time + timedelta(hours=self.BREAK_DURATION),
            duration_hours=self.BREAK_DURATION,
            location_name=f"{facility['city']}, {facility['state']} ({facility['brand']})",
            activity_description=f"Mandatory FMCSA 30-minute rest break at {facility['location_name']}",
            start_coordinates=actual_coords,
            end_coordinates=actual_coords
        ))
        self.stops.append(TripStop(
            stop_type='REST_30M',
            location_name=facility['location_name'],
            coordinates=actual_coords,
            arrival_time=self.current_time,
            departure_time=self.current_time + timedelta(hours=self.BREAK_DURATION),
            duration_hours=self.BREAK_DURATION,
            description="Mandatory 30-minute off-duty rest break required after 8 hours of driving",
            miles_from_start=round(self.total_miles_traveled, 1),
            address=facility['address'],
            city=facility['city'],
            state=facility['state'],
            zip_code=facility.get('zip_code', ''),
            rating=facility.get('rating'),
            user_ratings_total=facility.get('user_ratings_total'),
            photo_url=facility.get('photo_url'),
            amenities=facility.get('amenities', []),
            brand=facility.get('brand'),
            google_maps_url=facility.get('google_maps_url')
        ))
        self.current_time += timedelta(hours=self.BREAK_DURATION)
        self.shift_duty_window_hours += self.BREAK_DURATION  # Off-duty extends elapsed clock, counts towards 14h window
        self.driving_since_break = 0.0  # Reset 8h driving break clock

    def _insert_10h_rest(self, from_name, to_name, leg_coords, leg_completed, leg_total):
        rest_coord = self._interpolate_coords(leg_coords, leg_completed, leg_total)
        facility = self.places.find_best_stop_facility(
            target_coords=rest_coord,
            stop_type='REST_10H',
            miles_from_start=self.total_miles_traveled
        )
        actual_coords = facility["coordinates"]

        self.events.append(DutyEvent(
            status='SLEEPER_BERTH',
            start_time=self.current_time,
            end_time=self.current_time + timedelta(hours=self.DAILY_REST_DURATION),
            duration_hours=self.DAILY_REST_DURATION,
            location_name=f"{facility['city']}, {facility['state']} ({facility['brand']})",
            activity_description=f"Mandatory 10-hour consecutive sleeper berth rest at {facility['location_name']}",
            start_coordinates=actual_coords,
            end_coordinates=actual_coords
        ))
        self.stops.append(TripStop(
            stop_type='REST_10H',
            location_name=facility['location_name'],
            coordinates=actual_coords,
            arrival_time=self.current_time,
            departure_time=self.current_time + timedelta(hours=self.DAILY_REST_DURATION),
            duration_hours=self.DAILY_REST_DURATION,
            description="10 consecutive hours off-duty/sleeper berth to reset 11h driving clock and 14h duty window",
            miles_from_start=round(self.total_miles_traveled, 1),
            address=facility['address'],
            city=facility['city'],
            state=facility['state'],
            zip_code=facility.get('zip_code', ''),
            rating=facility.get('rating'),
            user_ratings_total=facility.get('user_ratings_total'),
            photo_url=facility.get('photo_url'),
            amenities=facility.get('amenities', []),
            brand=facility.get('brand'),
            google_maps_url=facility.get('google_maps_url')
        ))
        self.current_time += timedelta(hours=self.DAILY_REST_DURATION)
        # 10 consecutive hours resets shift clocks
        self.shift_driving_hours = 0.0
        self.shift_duty_window_hours = 0.0
        self.driving_since_break = 0.0

    def _insert_fuel_stop(self, from_name, to_name, leg_coords, leg_completed, leg_total):
        fuel_coord = self._interpolate_coords(leg_coords, leg_completed, leg_total)
        facility = self.places.find_best_stop_facility(
            target_coords=fuel_coord,
            stop_type='FUEL',
            miles_from_start=self.total_miles_traveled
        )
        actual_coords = facility["coordinates"]

        self.events.append(DutyEvent(
            status='ON_DUTY_NOT_DRIVING',
            start_time=self.current_time,
            end_time=self.current_time + timedelta(hours=self.FUEL_DURATION),
            duration_hours=self.FUEL_DURATION,
            location_name=f"{facility['city']}, {facility['state']} ({facility['brand']})",
            activity_description=f"Diesel Fueling & Pre-Trip Equipment Inspection at {facility['location_name']}",
            start_coordinates=actual_coords,
            end_coordinates=actual_coords
        ))
        self.stops.append(TripStop(
            stop_type='FUEL',
            location_name=facility['location_name'],
            coordinates=actual_coords,
            arrival_time=self.current_time,
            departure_time=self.current_time + timedelta(hours=self.FUEL_DURATION),
            duration_hours=self.FUEL_DURATION,
            description="Mandatory fueling stop (at least once every 1,000 miles) and vehicle inspection",
            miles_from_start=round(self.total_miles_traveled, 1),
            address=facility['address'],
            city=facility['city'],
            state=facility['state'],
            zip_code=facility.get('zip_code', ''),
            rating=facility.get('rating'),
            user_ratings_total=facility.get('user_ratings_total'),
            photo_url=facility.get('photo_url'),
            amenities=facility.get('amenities', []),
            brand=facility.get('brand'),
            google_maps_url=facility.get('google_maps_url')
        ))
        self.current_time += timedelta(hours=self.FUEL_DURATION)
        self.shift_duty_window_hours += self.FUEL_DURATION
        self.cycle_used_hours += self.FUEL_DURATION
        self.miles_since_fuel = 0.0  # Reset fuel counter

    def _record_activity(self, status: str, duration_hours: float, location_name: str, activity_description: str):
        self.events.append(DutyEvent(
            status=status,
            start_time=self.current_time,
            end_time=self.current_time + timedelta(hours=duration_hours),
            duration_hours=duration_hours,
            location_name=location_name,
            activity_description=activity_description
        ))
        self.current_time += timedelta(hours=duration_hours)
        self.shift_duty_window_hours += duration_hours
        if status in ('DRIVING', 'ON_DUTY_NOT_DRIVING'):
            self.cycle_used_hours += duration_hours

    def _interpolate_coords(self, coords: List[List[float]], current_dist: float, total_dist: float) -> Tuple[float, float]:
        if not coords:
            return (39.8283, -98.5795)
        if total_dist <= 0.001 or current_dist <= 0:
            return (coords[0][0], coords[0][1])
        if current_dist >= total_dist:
            return (coords[-1][0], coords[-1][1])

        ratio = current_dist / total_dist
        index = int(ratio * (len(coords) - 1))
        index = min(max(0, index), len(coords) - 1)
        return (coords[index][0], coords[index][1])
