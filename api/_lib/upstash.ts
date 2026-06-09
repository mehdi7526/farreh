type UpstashResponse<T> = {
  result?: T;
  error?: string;
};

const getEnv = () =>
  (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env ?? {};

const getRedisConfig = () => {
  const env = getEnv();
  const url = (
    env.UPSTASH_REDIS_REST_URL ??
    env.KV_REST_API_URL ??
    ""
  ).trim();
  const token = (
    env.UPSTASH_REDIS_REST_TOKEN ??
    env.KV_REST_API_TOKEN ??
    ""
  ).trim();

  if (!url || !token) {
    throw new Error("Redis REST URL and token are required.");
  }

  return {
    url: url.replace(/\/+$/, ""),
    token,
  };
};

export const redisCommand = async <T>(
  command: unknown[],
): Promise<T | null> => {
  const { url, token } = getRedisConfig();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  const payload = (await response.json().catch(() => null)) as
    | UpstashResponse<T>
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error ?? `Upstash request failed with status ${response.status}`,
    );
  }

  if (payload && typeof payload === "object" && "error" in payload && payload.error) {
    throw new Error(payload.error);
  }

  return payload && "result" in payload ? (payload.result ?? null) : null;
};

export const redisGet = (key: string) => redisCommand<string>(["GET", key]);

export const redisSet = (
  key: string,
  value: string,
  exSeconds?: number,
) => {
  const command = exSeconds
    ? ["SET", key, value, "EX", exSeconds]
    : ["SET", key, value];

  return redisCommand<string>(command);
};

export const redisDel = (...keys: string[]) =>
  keys.length > 0 ? redisCommand<number>(["DEL", ...keys]) : Promise.resolve(0);
