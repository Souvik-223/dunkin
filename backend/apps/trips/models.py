from django.db import models


class Trip(models.Model):
    """
    Stores calculated trip plans, routes, stops, and generated ELD logs.
    """
    current_location = models.CharField(max_length=255, help_text="Starting location")
    pickup_location = models.CharField(max_length=255, help_text="First stop for loading")
    dropoff_location = models.CharField(max_length=255, help_text="Final destination for unloading")
    current_cycle_used_hours = models.FloatField(default=0.0, help_text="Hours already used in 70h/8day cycle")

    # Cached results for quick retrieval
    total_distance_miles = models.FloatField(default=0.0)
    total_duration_hours = models.FloatField(default=0.0)
    total_driving_hours = models.FloatField(default=0.0)
    days_count = models.IntegerField(default=1)

    result_payload = models.JSONField(
        default=dict,
        blank=True,
        help_text="Full response containing route coordinates, stops, and ELD log sheets"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Trip: {self.current_location} -> {self.pickup_location} -> {self.dropoff_location} ({self.total_distance_miles} mi)"
