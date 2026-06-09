import { errorResponse, jsonResponse, readJsonBody } from "../_lib/http.js";
import {
  createAdminSession,
  isValidAdminCredentials,
} from "../_lib/session.js";

const methodNotAllowed = () => errorResponse("متد درخواست نامعتبر است.", 405);

export default {
  async fetch(request: Request) {
    try {
      if (request.method !== "POST") {
        return methodNotAllowed();
      }

      const body = await readJsonBody(request);
      if (!body || typeof body !== "object") {
        return errorResponse("درخواست نامعتبر است.", 400);
      }

      const username = (body as { username?: unknown }).username;
      const password = (body as { password?: unknown }).password;

      if (!isValidAdminCredentials(username, password)) {
        return errorResponse("رمز عبور درست نیست.", 401);
      }

      const session = await createAdminSession();

      return jsonResponse({
        authToken: session.token,
        username: session.username,
        expiresAt: session.expiresAt,
      });
    } catch (error) {
      console.error("[api/auth/login]", error);
      return errorResponse("خطای سرور.", 500);
    }
  },
};
