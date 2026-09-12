from datetime import datetime, timezone
from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema


class HealthCheckView(APIView):
    """
    Health check endpoint for container orchestrators and monitoring tools.
    Verifies database connectivity and API responsiveness.
    """
    permission_classes = []
    authentication_classes = []

    @extend_schema(
        summary="Service Health Check",
        description="Returns system status, database connectivity, and server timestamp.",
        responses={200: dict, 503: dict}
    )
    def get(self, request):
        db_healthy = False
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                row = cursor.fetchone()
                db_healthy = (row is not None and row[0] == 1)
        except Exception:
            db_healthy = False

        status_code = status.HTTP_200_OK if db_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response({
            "status": "healthy" if db_healthy else "unhealthy",
            "database": "connected" if db_healthy else "disconnected",
            "service": "spotter-hos-api",
            "version": "1.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }, status=status_code)
