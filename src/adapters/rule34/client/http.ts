import { RateLimiter } from "@/lib/async/rate_limiting";

export type PageRequests = Pick<RateLimiter, "run">;
export const sitePageRequests: PageRequests = new RateLimiter({ concurrency: 1, ratePerSecond: 0.3 });
