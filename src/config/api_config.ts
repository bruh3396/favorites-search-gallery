import { RateLimiterConfig } from "@/types/async";

export const ApiConfig = {
  maxRequests: 25,
  requestFlushTimeout: 40,
  postRateLimit: { concurrency: 4, ratePerSecond: 5 } satisfies RateLimiterConfig,
  tagRateLimit: { concurrency: 4, ratePerSecond: 10 } satisfies RateLimiterConfig
};
