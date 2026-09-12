from .base import *

DEBUG = True

# Allow all CORS in development or use explicit origins
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

ALLOWED_HOSTS = ['*']

# Simpler static files handling in local development
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
