import { RateLimiter } from "@/lib/async/rate_limiting";

export const pageRateLimiter = new RateLimiter({ concurrency: 1, ratePerSecond: 0.3 });
