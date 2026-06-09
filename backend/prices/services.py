from .defaults import get_default_price_state
from .models import PriceState


def normalize_price(value, fallback: int) -> int:
    try:
        number_value = int(round(float(value)))
    except (TypeError, ValueError):
        return fallback

    return number_value if number_value >= 0 else fallback


def merge_price_state(saved) -> dict:
    defaults = get_default_price_state()
    if not isinstance(saved, dict):
        return defaults

    saved_products = saved.get("productPrices")
    if not isinstance(saved_products, dict):
        saved_products = {}

    return {
        "gramBuyPriceRial": normalize_price(
            saved.get("gramBuyPriceRial"),
            defaults["gramBuyPriceRial"],
        ),
        "gramSellPriceRial": normalize_price(
            saved.get("gramSellPriceRial"),
            defaults["gramSellPriceRial"],
        ),
        "productPrices": {
            product_id: {
                "buyPriceRial": normalize_price(
                    saved_products.get(product_id, {}).get("buyPriceRial")
                    if isinstance(saved_products.get(product_id), dict)
                    else None,
                    price["buyPriceRial"],
                ),
                "sellPriceRial": normalize_price(
                    saved_products.get(product_id, {}).get("sellPriceRial")
                    if isinstance(saved_products.get(product_id), dict)
                    else None,
                    price["sellPriceRial"],
                ),
            }
            for product_id, price in defaults["productPrices"].items()
        },
    }


def get_current_price_payload() -> dict:
    price_state = PriceState.objects.filter(singleton_key="current").first()

    if not price_state:
        return {
            "prices": get_default_price_state(),
            "updatedAt": None,
        }

    return {
        "prices": merge_price_state(price_state.prices),
        "updatedAt": price_state.updated_at.isoformat(),
    }


def save_current_price_state(prices: dict) -> dict:
    normalized_prices = merge_price_state(prices)
    price_state, _created = PriceState.objects.update_or_create(
        singleton_key="current",
        defaults={"prices": normalized_prices},
    )

    return {
        "prices": normalized_prices,
        "updatedAt": price_state.updated_at.isoformat(),
    }
