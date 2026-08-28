import { RateLimiterConfig } from "@/types/async";

export const ApiConfig = {
  coalesceSize: 50,
  flushTimeout: 2000,
  metadataRetries: 5,
  postRateLimit: { concurrency: 4, ratePerSecond: 2 } satisfies RateLimiterConfig,
  tagRateLimit: { concurrency: 4, ratePerSecond: 10 } satisfies RateLimiterConfig
};
