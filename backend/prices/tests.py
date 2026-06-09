import json
from datetime import timedelta

from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from .defaults import get_default_price_state
from .models import AdminSession, PriceState


@override_settings(PRICE_ADMIN_PASSWORD="secret")
class PricesApiTests(TestCase):
    def test_get_returns_defaults_before_save(self):
        response = self.client.get(reverse("prices_api"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["prices"], get_default_price_state())
        self.assertIsNone(payload["updatedAt"])

    def test_login_rejects_wrong_credentials(self):
        response = self.client.post(
            reverse("auth_login"),
            data=json.dumps({"username": "wrong", "password": "wrong"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)

    def test_login_accepts_correct_credentials(self):
        response = self.client.post(
            reverse("auth_login"),
            data=json.dumps({"username": "farreh_admin", "password": "secret"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["username"], "farreh_admin")
        self.assertIsInstance(payload["authToken"], str)
        self.assertIsInstance(payload["expiresAt"], str)
        self.assertEqual(AdminSession.objects.count(), 1)
        session = AdminSession.objects.get()
        self.assertEqual(session.username, "farreh_admin")
        self.assertEqual(session.token, payload["authToken"])
        self.assertGreater(session.expires_at, timezone.now())

    def test_save_persists_prices_and_get_returns_saved_state(self):
        prices = get_default_price_state()
        prices["gramBuyPriceRial"] = 2_200_000
        prices["productPrices"]["farreh-shot-25g"]["buyPriceRial"] = 55_000_000

        login_response = self.client.post(
            reverse("auth_login"),
            data=json.dumps(
                {"username": "farreh_admin", "password": "secret"},
            ),
            content_type="application/json",
        )
        token = login_response.json()["authToken"]

        save_response = self.client.post(
            reverse("prices_api"),
            data=json.dumps(
                {
                    "action": "save",
                    "prices": prices,
                },
            ),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(save_response.status_code, 200)
        self.assertEqual(PriceState.objects.count(), 1)
        self.assertEqual(save_response.json()["prices"], prices)
        self.assertIsNotNone(save_response.json()["updatedAt"])

        get_response = self.client.get(reverse("prices_api_slash"))

        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_response.json()["prices"], prices)
        self.assertIsNotNone(get_response.json()["updatedAt"])

    def test_save_rejects_missing_or_invalid_token(self):
        response = self.client.post(
            reverse("prices_api"),
            data=json.dumps({"action": "save", "prices": get_default_price_state()}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)

    def test_save_rejects_expired_token(self):
        login_response = self.client.post(
            reverse("auth_login"),
            data=json.dumps(
                {"username": "farreh_admin", "password": "secret"},
            ),
            content_type="application/json",
        )
        token = login_response.json()["authToken"]

        AdminSession.objects.filter(token=token).update(
            expires_at=timezone.now() - timedelta(seconds=1),
        )

        response = self.client.post(
            reverse("prices_api"),
            data=json.dumps(
                {
                    "action": "save",
                    "prices": get_default_price_state(),
                },
            ),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 401)
        self.assertFalse(AdminSession.objects.filter(token=token).exists())
