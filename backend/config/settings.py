from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "farreh-gallery-dev-secret-key",
)
DEBUG = os.environ.get("DJANGO_DEBUG", "true").lower() == "true"
ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")
    if host.strip()
]

INSTALLED_APPS = [
    "prices",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

LANGUAGE_CODE = "fa-ir"
TIME_ZONE = "Asia/Tehran"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

PRICE_ADMIN_PASSWORD = os.environ.get("PRICE_ADMIN_PASSWORD", "uFQyy97z1")
PRICE_ADMIN_USERNAME = os.environ.get("PRICE_ADMIN_USERNAME", "farreh_admin")
PRICE_AUTH_TOKEN_MAX_AGE_SECONDS = int(
    os.environ.get("PRICE_AUTH_TOKEN_MAX_AGE_SECONDS", str(60 * 60 * 8))
)
