from rest_framework import serializers
from .models import Trip


class TripPlanInputSerializer(serializers.Serializer):
    """
    Validates trip input requirements:
    - Current Location
    - Pickup Location
    - Dropoff Location
    - Current Cycle Used (Hrs)
    """
    current_location = serializers.CharField(
        max_length=255,
        required=True,
        help_text="Driver starting point / terminal (e.g., 'Chicago, IL')"
    )
    pickup_location = serializers.CharField(
        max_length=255,
        required=True,
        help_text="Shipper pickup location where 1h loading occurs (e.g., 'St. Louis, MO')"
    )
    dropoff_location = serializers.CharField(
        max_length=255,
        required=True,
        help_text="Receiver destination where 1h unloading occurs (e.g., 'Los Angeles, CA')"
    )
    current_cycle_used_hours = serializers.FloatField(
        required=False,
        default=0.0,
        min_value=0.0,
        max_value=70.0,
        help_text="Hours accumulated in the driver's rolling 70-hour / 8-day cycle"
    )
    start_time = serializers.DateTimeField(
        required=False,
        allow_null=True,
        help_text="Trip start timestamp (defaults to current day 06:00 AM if omitted)"
    )
    driver_name = serializers.CharField(
        max_length=255,
        required=False,
        default="John Doe / Driver #1",
        help_text="Driver name displayed on ELD log sheet"
    )
    carrier_name = serializers.CharField(
        max_length=255,
        required=False,
        default="Spotter Freight Logistics",
        help_text="Carrier name displayed on ELD log sheet"
    )
    truck_tractor_no = serializers.CharField(
        max_length=255,
        required=False,
        default="TRK-9842 / TRL-4412",
        help_text="Truck/Tractor and Trailer ID displayed on ELD log sheet"
    )

    def validate_current_cycle_used_hours(self, value):
        if value < 0.0 or value > 70.0:
            raise serializers.ValidationError("Current cycle hours must be between 0 and 70 hours.")
        return value


class PresetTripSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    current_location = serializers.CharField()
    pickup_location = serializers.CharField()
    dropoff_location = serializers.CharField()
    current_cycle_used_hours = serializers.FloatField()


class TripHistoryItemSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for trip history listing without heavyweight result_payload.
    """
    class Meta:
        model = Trip
        fields = [
            'id',
            'current_location',
            'pickup_location',
            'dropoff_location',
            'current_cycle_used_hours',
            'total_distance_miles',
            'total_duration_hours',
            'total_driving_hours',
            'days_count',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class TripModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            'id',
            'current_location',
            'pickup_location',
            'dropoff_location',
            'current_cycle_used_hours',
            'total_distance_miles',
            'total_duration_hours',
            'total_driving_hours',
            'days_count',
            'result_payload',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
