GRAM_BUY_PRICE_RIAL = 1_200_000
GRAM_SELL_PRICE_RIAL = 1_350_000

PRODUCT_WEIGHTS_GRAMS = {
    "farreh-shot-25g": 25,
    "farreh-shot-50g": 50,
    "farreh-shot-100g": 100,
    "farreh-shot-250g": 250,
    "farreh-shot-500g": 500,
    "farreh-shot-1000g": 1000,
    "nadir-silver-bar-1000g": 1000,
}


def get_default_price_state() -> dict:
    return {
        "gramBuyPriceRial": GRAM_BUY_PRICE_RIAL,
        "gramSellPriceRial": GRAM_SELL_PRICE_RIAL,
        "productPrices": {
            product_id: {
                "buyPriceRial": weight * GRAM_BUY_PRICE_RIAL,
                "sellPriceRial": weight * GRAM_SELL_PRICE_RIAL,
            }
            for product_id, weight in PRODUCT_WEIGHTS_GRAMS.items()
        },
    }
