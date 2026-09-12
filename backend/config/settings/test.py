from .base import *

DEBUG = False

# Use in-memory SQLite database for ultra-fast test execution
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Use fast password hasher for test speed
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
