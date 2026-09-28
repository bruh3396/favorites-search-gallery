import { RateLimiter } from "@/lib/async/rate_limiting";
import { Rule34NetworkConfig } from "@/adapters/rule34/client/network_config";

const pageRequestLimiter = new RateLimiter(Rule34NetworkConfig.generalPageRequestRateLimit);

export function runPageRequest<T>(request: () => Promise<T>): Promise<T> {
  return pageRequestLimiter.run(request);
}
