import type { Product } from "../data/products";

export const PRICE_STORAGE_KEY = "farreh-gallery-prices-v1";
export const PRICE_STORAGE_EVENT = "farreh-gallery-prices-updated";

export interface PriceValues {
  buyPriceRial: number;
  sellPriceRial: number;
}

export interface SavedPriceState {
  gramBuyPriceRial: number;
  gramSellPriceRial: number;
  productPrices: Record<string, PriceValues>;
}

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

export const getDefaultPriceState = (
  products: Product[],
  gramBuyPriceRial: number,
  gramSellPriceRial: number,
): SavedPriceState => ({
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

export const readPriceState = (defaults: SavedPriceState): SavedPriceState => {
  if (typeof window === "undefined") return defaults;

  try {
    const rawValue = window.localStorage.getItem(PRICE_STORAGE_KEY);
    return mergePriceState(defaults, rawValue ? JSON.parse(rawValue) : null);
  } catch {
    return defaults;
  }
};

export const writePriceState = (state: SavedPriceState) => {
  window.localStorage.setItem(PRICE_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(PRICE_STORAGE_EVENT));
};

export const applyPriceStateToProducts = (
  sourceProducts: Product[],
  state: SavedPriceState,
): Product[] =>
  sourceProducts.map((product) => ({
    ...product,
    buyPriceRial:
      state.productPrices[product.id]?.buyPriceRial ?? product.buyPriceRial,
    sellPriceRial:
      state.productPrices[product.id]?.sellPriceRial ?? product.sellPriceRial,
  }));
