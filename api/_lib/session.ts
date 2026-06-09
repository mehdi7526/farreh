import { redisDel, redisGet, redisSet } from "./upstash.js";

type AdminSessionRecord = {
  token: string;
  username: string;
  expiresAt: string;
  createdAt: string;
};

const SESSION_KEY = "admin-session:v1";
const DEFAULT_USERNAME = "farreh_admin";
const DEFAULT_PASSWORD = "uFQyy97z1";
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 8;

const getEnv = () =>
  (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env ?? {};

export const getAdminUsername = () =>
  getEnv().PRICE_ADMIN_USERNAME?.trim() || DEFAULT_USERNAME;

export const getAdminPassword = () =>
  getEnv().PRICE_ADMIN_PASSWORD?.trim() || DEFAULT_PASSWORD;

export const getAuthTokenMaxAgeSeconds = () => {
  const rawValue =
    getEnv().PRICE_AUTH_TOKEN_MAX_AGE_SECONDS?.trim() ??
    String(DEFAULT_MAX_AGE_SECONDS);
  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? Math.round(parsedValue)
    : DEFAULT_MAX_AGE_SECONDS;
};

export const getBearerToken = (request: Request) => {
  const authorization = request.headers.get("Authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
};

const generateToken = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

export const isValidAdminCredentials = (
  username: unknown,
  password: unknown,
) => {
  return (
    typeof username === "string" &&
    typeof password === "string" &&
    username === getAdminUsername() &&
    password === getAdminPassword()
  );
};

export const createAdminSession = async () => {
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + getAuthTokenMaxAgeSeconds() * 1000,
  );
  const record: AdminSessionRecord = {
    token: generateToken(),
    username: getAdminUsername(),
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };

  await redisSet(
    SESSION_KEY,
    JSON.stringify(record),
    getAuthTokenMaxAgeSeconds(),
  );

  return record;
};

export const verifyAdminSession = async (token: string | null) => {
  if (!token) return null;

  const rawSession = await redisGet(SESSION_KEY);
  if (!rawSession) return null;

  let parsedSession: unknown = null;

  try {
    parsedSession = JSON.parse(rawSession);
  } catch {
    await redisDel(SESSION_KEY);
    return null;
  }

  if (!parsedSession || typeof parsedSession !== "object") {
    await redisDel(SESSION_KEY);
    return null;
  }

  const session = parsedSession as Partial<AdminSessionRecord>;

  if (
    session.token !== token ||
    session.username !== getAdminUsername() ||
    typeof session.expiresAt !== "string"
  ) {
    return null;
  }

  const expiresAtMs = new Date(session.expiresAt).getTime();
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    await redisDel(SESSION_KEY);
    return null;
  }

  return session;
};
