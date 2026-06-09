import type { Product } from "../data/products";

const PRICE_API_ENDPOINT = "/api/prices";
const AUTH_LOGIN_ENDPOINT = "/api/auth/login";
export const AUTH_TOKEN_STORAGE_KEY = "auth_token";

export interface PriceValues {
  buyPriceRial: number;
  sellPriceRial: number;
}

export interface SavedPriceState {
  gramBuyPriceRial: number;
  gramSellPriceRial: number;
  productPrices: Record<string, PriceValues>;
}

export interface PriceApiResponse {
  prices: SavedPriceState;
  updatedAt: string | null;
}

export class PriceApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PriceApiError";
    this.status = status;
  }
}

export interface LoginResponse {
  authToken: string;
  username: string;
  expiresAt: string;
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

const readJsonResponse = async (response: Response) => {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
};

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== "object") return fallback;

  const record = payload as { error?: unknown };
  return typeof record.error === "string" ? record.error : fallback;
};

const parsePriceApiResponse = (
  defaults: SavedPriceState,
  payload: unknown,
): PriceApiResponse => {
  const record =
    payload && typeof payload === "object"
      ? (payload as { prices?: unknown; updatedAt?: unknown })
      : {};

  return {
    prices: mergePriceState(defaults, record.prices),
    updatedAt:
      typeof record.updatedAt === "string" ? record.updatedAt : null,
  };
};

export const fetchPriceState = async (
  defaults: SavedPriceState,
): Promise<PriceApiResponse> => {
  const response = await fetch(PRICE_API_ENDPOINT, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new PriceApiError(
      getErrorMessage(payload, "امکان دریافت قیمت‌ها وجود ندارد."),
      response.status,
    );
  }

  return parsePriceApiResponse(defaults, payload);
};

export const readAuthToken = () => {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? "";
};

export const writeAuthToken = (token: string) => {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const clearAuthToken = () => {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

export const loginAdmin = async (
  username: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await fetch(AUTH_LOGIN_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new PriceApiError(
      getErrorMessage(payload, "امکان ورود وجود ندارد."),
      response.status,
    );
  }

  const record =
    payload && typeof payload === "object"
      ? (payload as {
          authToken?: unknown;
          username?: unknown;
          expiresAt?: unknown;
        })
      : {};

  if (
    typeof record.authToken !== "string" ||
    typeof record.username !== "string"
  ) {
    throw new PriceApiError("پاسخ ورود نامعتبر است.", 502);
  }

  if (typeof record.expiresAt !== "string") {
    throw new PriceApiError("پاسخ ورود نامعتبر است.", 502);
  }

  return {
    authToken: record.authToken,
    username: record.username,
    expiresAt: record.expiresAt,
  };
};

export const savePriceState = async (
  authToken: string,
  prices: SavedPriceState,
  defaults: SavedPriceState,
): Promise<PriceApiResponse> => {
  const response = await fetch(PRICE_API_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "save", prices }),
  });
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new PriceApiError(
      getErrorMessage(payload, "امکان ذخیره قیمت‌ها وجود ندارد."),
      response.status,
    );
  }

  return parsePriceApiResponse(defaults, payload);
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
