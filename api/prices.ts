import {
  errorResponse,
  jsonResponse,
  readJsonBody,
} from "./_lib/http.js";
import {
  getBearerToken,
  verifyAdminSession,
} from "./_lib/session.js";
import {
  readCurrentPriceState,
  saveCurrentPriceState,
} from "./_lib/price-state.js";

const methodNotAllowed = () => errorResponse("متد درخواست نامعتبر است.", 405);

export default {
  async fetch(request: Request) {
    try {
      if (request.method === "GET") {
        return jsonResponse(await readCurrentPriceState());
      }

      if (request.method !== "POST") {
        return methodNotAllowed();
      }

      const body = await readJsonBody(request);
      if (!body || typeof body !== "object") {
        return errorResponse("درخواست نامعتبر است.", 400);
      }

      const action = (body as { action?: unknown }).action;
      if (action !== "save") {
        return errorResponse("عملیات نامعتبر است.", 400);
      }

      const session = await verifyAdminSession(getBearerToken(request));
      if (!session) {
        return errorResponse("جلسه شما نامعتبر است.", 401);
      }

      const prices = (body as { prices?: unknown }).prices;
      return jsonResponse(await saveCurrentPriceState(prices));
    } catch (error) {
      console.error("[api/prices]", error);
      return errorResponse("خطای سرور.", 500);
    }
  },
};
