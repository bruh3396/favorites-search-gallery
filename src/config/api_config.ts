import { RateLimiterConfig } from "@/types/async";

export const ApiConfig = {
  maxRequests: 50,
  requestFlushTimeout: 40,
  postRateLimit: { concurrency: 4, ratePerSecond: 10 } satisfies RateLimiterConfig,
  tagRateLimit: { concurrency: 4, ratePerSecond: 10 } satisfies RateLimiterConfig
};
