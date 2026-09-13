from django.urls import path
from .views import (
    TripPlanAPIView,
    TripPresetsAPIView,
    TripHistoryAPIView,
    TripDetailAPIView,
    LocationAutocompleteAPIView
)

app_name = 'trips'

urlpatterns = [
    path('plan/', TripPlanAPIView.as_view(), name='trip-plan'),
    path('presets/', TripPresetsAPIView.as_view(), name='trip-presets'),
    path('history/', TripHistoryAPIView.as_view(), name='trip-history'),
    path('autocomplete/', LocationAutocompleteAPIView.as_view(), name='location-autocomplete'),
    path('<int:trip_id>/', TripDetailAPIView.as_view(), name='trip-detail'),
]
