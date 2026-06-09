import secrets
from datetime import datetime, timedelta

from django.conf import settings
from django.utils import timezone

from .models import AdminSession


def create_auth_session(username: str) -> tuple[str, datetime]:
    AdminSession.objects.filter(username=username).delete()

    expires_at = timezone.now() + timedelta(
        seconds=settings.PRICE_AUTH_TOKEN_MAX_AGE_SECONDS,
    )
    token = secrets.token_urlsafe(32)
    AdminSession.objects.create(
        token=token,
        username=username,
        expires_at=expires_at,
    )

    return token, expires_at


def get_bearer_token(request) -> str | None:
    authorization = request.headers.get("Authorization", "")
    if authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        return token or None
    return None


def verify_auth_token(token: str | None) -> bool:
    if not token:
        return False

    session = AdminSession.objects.filter(
        token=token,
        username=settings.PRICE_ADMIN_USERNAME,
    ).first()

    if not session:
        return False

    if session.expires_at <= timezone.now():
        session.delete()
        return False

    return True
