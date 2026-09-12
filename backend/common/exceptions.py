import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Standardizes error responses across all API endpoints:
    {
        "success": false,
        "error": {
            "code": "ValidationError" | "NotFound" | ...,
            "message": "Human-readable message",
            "details": {...}
        }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "success": False,
            "error": {
                "code": exc.__class__.__name__,
                "message": "A validation or request error occurred.",
                "details": response.data
            }
        }
        response.data = custom_data
        return response

    logger.exception("Unhandled server exception: %s", exc)
    return Response(
        {
            "success": False,
            "error": {
                "code": "InternalServerError",
                "message": "An unexpected server error occurred. Please try again later.",
                "details": str(exc) if context.get('request') and getattr(context['request'].user, 'is_staff', False) else None
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
