import { gramBuyPriceRial, gramSellPriceRial, products } from "../../src/data/products";

import { redisGet, redisSet } from "./upstash";

export interface PriceValues {
  buyPriceRial: number;
  sellPriceRial: number;
}

export interface SavedPriceState {
  gramBuyPriceRial: number;
  gramSellPriceRial: number;
  productPrices: Record<string, PriceValues>;
}

type StoredPricePayload = {
  prices?: unknown;
  updatedAt?: unknown;
};

const PRICE_STATE_KEY = "prices:v1";

const normalizePrice = (value: unknown, fallback: number) => {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(/[^\d.-]/g, ""))
        : Number.NaN;

  return Number.isFinite(numberValue) && numberValue >= 0
    ? Math.round(numberValue)
    : fallback;
};

export const getDefaultPriceState = (): SavedPriceState => ({
  gramBuyPriceRial,
  gramSellPriceRial,
  productPrices: Object.fromEntries(
    products.map((product) => [
      product.id,
      {
        buyPriceRial: product.buyPriceRial,
        sellPriceRial: product.sellPriceRial,
      },
    ]),
  ),
});

export const mergePriceState = (
  defaults: SavedPriceState,
  saved: unknown,
): SavedPriceState => {
  if (!saved || typeof saved !== "object") return defaults;

  const savedRecord = saved as Partial<SavedPriceState>;
  const savedProducts =
    savedRecord.productPrices && typeof savedRecord.productPrices === "object"
      ? savedRecord.productPrices
      : {};

  return {
    gramBuyPriceRial: normalizePrice(
      savedRecord.gramBuyPriceRial,
      defaults.gramBuyPriceRial,
    ),
    gramSellPriceRial: normalizePrice(
      savedRecord.gramSellPriceRial,
      defaults.gramSellPriceRial,
    ),
    productPrices: Object.fromEntries(
      Object.entries(defaults.productPrices).map(([productId, price]) => {
        const savedPrice = savedProducts[productId];

        return [
          productId,
          {
            buyPriceRial: normalizePrice(
              savedPrice?.buyPriceRial,
              price.buyPriceRial,
            ),
            sellPriceRial: normalizePrice(
              savedPrice?.sellPriceRial,
              price.sellPriceRial,
            ),
          },
        ];
      }),
    ),
  };
};

export const readCurrentPriceState = async (): Promise<{
  prices: SavedPriceState;
  updatedAt: string | null;
}> => {
  const rawState = await redisGet(PRICE_STATE_KEY);
  const defaults = getDefaultPriceState();

  if (!rawState) {
    return {
      prices: defaults,
      updatedAt: null,
    };
  }

  let parsed: StoredPricePayload | null = null;

  try {
    parsed = JSON.parse(rawState) as StoredPricePayload;
  } catch {
    parsed = null;
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      prices: defaults,
      updatedAt: null,
    };
  }

  return {
    prices: mergePriceState(defaults, parsed.prices),
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
  };
};

export const saveCurrentPriceState = async (
  savedPrices: unknown,
): Promise<{
  prices: SavedPriceState;
  updatedAt: string;
}> => {
  const defaults = getDefaultPriceState();
  const prices = mergePriceState(defaults, savedPrices);
  const updatedAt = new Date().toISOString();

  await redisSet(
    PRICE_STATE_KEY,
    JSON.stringify({
      prices,
      updatedAt,
    }),
  );

  return {
    prices,
    updatedAt,
  };
};
