from typing import List, Dict, Any, Optional
from .models import Trip


def get_preset_trips() -> List[Dict[str, Any]]:
    """
    Returns realistic sample trips with pre-configured parameters
    for quick demonstration, UI testing, and presentation video recording.
    """
    return [
        {
            "id": "cross-country-la",
            "title": "Cross-Country Haul (Multi-Day)",
            "description": "Chicago, IL to Los Angeles, CA (~2,000 mi) requiring multiple 10h rests, fuel stops, and 30m breaks.",
            "current_location": "Chicago, IL",
            "pickup_location": "St. Louis, MO",
            "dropoff_location": "Los Angeles, CA",
            "current_cycle_used_hours": 15.0,
        },
        {
            "id": "regional-texas",
            "title": "Regional Texas Freight (~650 mi)",
            "description": "Dallas, TX to Houston, TX with pickup in Austin, TX. Single-day turnaround.",
            "current_location": "Dallas, TX",
            "pickup_location": "Austin, TX",
            "dropoff_location": "Houston, TX",
            "current_cycle_used_hours": 28.5,
        },
        {
            "id": "tight-cycle-southeast",
            "title": "Southeast Corridor (High Cycle Usage)",
            "description": "Atlanta, GA to Miami, FL (~660 mi) with 60 hours already used in 70h cycle.",
            "current_location": "Atlanta, GA",
            "pickup_location": "Jacksonville, FL",
            "dropoff_location": "Miami, FL",
            "current_cycle_used_hours": 58.0,
        },
    ]


def get_trip_by_id(trip_id: int) -> Optional[Trip]:
    """
    Retrieves a single Trip model instance by ID or None.
    """
    try:
        return Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return None


def list_recent_trips(limit: int = 50) -> List[Trip]:
    """
    Returns the most recently planned trips for history and auditing.
    """
    return list(Trip.objects.all().order_by('-created_at')[:limit])
