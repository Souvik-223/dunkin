from rest_framework.renderers import JSONRenderer


class CustomJSONRenderer(JSONRenderer):
    """
    Standardizes successful JSON API responses if desired,
    or passes through dict responses with uniform serialization.
    """
    charset = 'utf-8'
