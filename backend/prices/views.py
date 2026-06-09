import json

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .auth import create_auth_session, get_bearer_token, verify_auth_token
from .services import get_current_price_payload, save_current_price_state


def error_response(message: str, status: int) -> JsonResponse:
    return JsonResponse({"error": message}, status=status)


def read_json_body(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return None


def is_valid_password(password) -> bool:
    return (
        isinstance(password, str)
        and password == settings.PRICE_ADMIN_PASSWORD
    )


def is_valid_username(username) -> bool:
    return (
        isinstance(username, str)
        and username == settings.PRICE_ADMIN_USERNAME
    )


@csrf_exempt
@require_http_methods(["GET", "POST"])
def prices_api(request):
    if request.method == "GET":
        return JsonResponse(get_current_price_payload())

    body = read_json_body(request)
    if not isinstance(body, dict):
        return error_response("درخواست نامعتبر است.", 400)

    action = body.get("action")

    if action != "save":
        return error_response("عملیات نامعتبر است.", 400)

    if not verify_auth_token(get_bearer_token(request)):
        return error_response("جلسه شما نامعتبر است.", 401)

    return JsonResponse(save_current_price_state(body.get("prices")))


@csrf_exempt
@require_http_methods(["POST"])
def auth_login(request):
    body = read_json_body(request)
    if not isinstance(body, dict):
        return error_response("درخواست نامعتبر است.", 400)

    if not is_valid_username(body.get("username")) or not is_valid_password(
        body.get("password"),
    ):
        return error_response("رمز عبور درست نیست.", 401)

    auth_token, expires_at = create_auth_session(settings.PRICE_ADMIN_USERNAME)

    return JsonResponse(
        {
            "authToken": auth_token,
            "username": settings.PRICE_ADMIN_USERNAME,
            "expiresAt": expires_at.isoformat(),
        },
    )
