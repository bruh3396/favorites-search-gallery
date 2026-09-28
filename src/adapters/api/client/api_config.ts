import { RateLimiterConfig } from "@/types/async";

declare const USE_LOCAL_SERVER: boolean;

export const ApiConfig = {
  serverOrigin: USE_LOCAL_SERVER ? "http://localhost:8787" : "https://frozencobalt.stream",
  coalesceSize: 50,
  flushTimeout: 2000,
  postRetries: 5,
  postRateLimit: { concurrency: 4, ratePerSecond: 2 } satisfies RateLimiterConfig,
  tagRateLimit: { concurrency: 4, ratePerSecond: 10 } satisfies RateLimiterConfig
};
