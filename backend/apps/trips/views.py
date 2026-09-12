from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiExample

from .serializers import (
    TripPlanInputSerializer,
    PresetTripSerializer,
    TripModelSerializer,
    TripHistoryItemSerializer
)
from .services import TripPlannerService
from .selectors import get_preset_trips, list_recent_trips, get_trip_by_id


class TripPlanAPIView(APIView):
    """
    Main endpoint for Interstate Truck Route Planning & ELD Log Generation.
    Takes trip details, computes compliance breaks (11h drive, 14h window, 30m rest,
    1000m fueling, 1h pickup/dropoff), and outputs the complete route map data
    and 24-hour FMCSA Driver's Daily Log Sheets.
    """

    @extend_schema(
        summary="Plan Route and Generate ELD Logs",
        description=(
            "Accepts Current Location, Pickup Location, Dropoff Location, and "
            "Current Cycle Used (Hours). Returns route map coordinates, stop waypoints, "
            "and multi-day FMCSA 24-hour ELD driver log sheets."
        ),
        request=TripPlanInputSerializer,
        responses={200: dict, 400: dict}
    )
    def post(self, request):
        serializer = TripPlanInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "error": {
                    "code": "ValidationError",
                    "message": "Invalid trip input parameters.",
                    "details": serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        planner = TripPlannerService()

        try:
            result = planner.plan_and_save_trip(
                current_location_query=data['current_location'],
                pickup_location_query=data['pickup_location'],
                dropoff_location_query=data['dropoff_location'],
                current_cycle_used_hours=data.get('current_cycle_used_hours', 0.0),
                start_time=data.get('start_time'),
                driver_name=data.get('driver_name', 'John Doe / Driver #1'),
                carrier_name=data.get('carrier_name', 'Spotter Freight Logistics'),
                truck_tractor_no=data.get('truck_tractor_no', 'TRK-9842 / TRL-4412')
            )
            return Response({
                "success": True,
                "data": result
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "error": {
                    "code": "CalculationError",
                    "message": str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TripPresetsAPIView(APIView):
    """
    Returns pre-configured sample trips for quick demonstration and testing.
    """

    @extend_schema(
        summary="Get Trip Presets",
        description="Returns realistic pre-configured trips with varied distances and cycle hours.",
        responses={200: PresetTripSerializer(many=True)}
    )
    def get(self, request):
        presets = get_preset_trips()
        return Response({
            "success": True,
            "data": presets
        }, status=status.HTTP_200_OK)


class TripHistoryAPIView(APIView):
    """
    Lists recently planned trips for the driver's history tab.
    """

    @extend_schema(
        summary="List Recent Trips",
        description="Returns lightweight list of recently calculated and saved trips for history viewing.",
        responses={200: TripHistoryItemSerializer(many=True)}
    )
    def get(self, request):
        trips = list_recent_trips(limit=50)
        serializer = TripHistoryItemSerializer(trips, many=True)
        return Response({
            "success": True,
            "data": serializer.data
        }, status=status.HTTP_200_OK)


class TripDetailAPIView(APIView):
    """
    Retrieves or deletes full payload of a previously calculated trip.
    """

    @extend_schema(
        summary="Get Trip by ID",
        description="Returns complete route, stops, and ELD log sheets for a given trip ID.",
        responses={200: dict, 404: dict}
    )
    def get(self, request, trip_id):
        trip = get_trip_by_id(trip_id)
        if not trip:
            return Response({
                "success": False,
                "error": {
                    "code": "NotFound",
                    "message": f"Trip with ID {trip_id} does not exist."
                }
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "success": True,
            "data": trip.result_payload
        }, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Delete Trip by ID",
        description="Deletes a saved trip from history.",
        responses={200: dict, 404: dict}
    )
    def delete(self, request, trip_id):
        trip = get_trip_by_id(trip_id)
        if not trip:
            return Response({
                "success": False,
                "error": {
                    "code": "NotFound",
                    "message": f"Trip with ID {trip_id} does not exist."
                }
            }, status=status.HTTP_404_NOT_FOUND)

        trip.delete()
        return Response({
            "success": True,
            "data": {"deleted": True, "trip_id": trip_id}
        }, status=status.HTTP_200_OK)

