import { ApiConfig } from "@/config/api_config";
import { RateLimiter } from "@/lib/async/rate_limiter";
import { RateLimiterConfig } from "@/types/async";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { ThrottleQueue } from "@/lib/async/throttled_queue";

function createRateLimiter({ concurrency, ratePerSecond }: RateLimiterConfig): RateLimiter {
  return new RateLimiter(concurrency, ratePerSecond);
}

export const postLimiter = createRateLimiter(ApiConfig.postRateLimit);
export const tagLimiter = createRateLimiter(ApiConfig.tagRateLimit);
export const extensionProbeLimiter = createRateLimiter(Rule34NetworkConfig.extensionProbeRateLimit);
export const generalPageRequestLimiter = createRateLimiter(Rule34NetworkConfig.generalPageRequestRateLimit);

export const favoriteAddThrottle = new ThrottleQueue(Rule34NetworkConfig.favoriteAddThrottle);
export const favoriteRemoveThrottle = new ThrottleQueue(Rule34NetworkConfig.favoriteRemoveThrottle);
