import { ApiConfig } from "@/config/api_config";
import { RateLimiter } from "@/lib/async/rate_limiter";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { ThrottleQueue } from "@/lib/async/throttle_queue";

export const postLimiter = new RateLimiter(ApiConfig.postRateLimit);
export const tagLimiter = new RateLimiter(ApiConfig.tagRateLimit);
export const extensionProbeLimiter = new RateLimiter(Rule34NetworkConfig.extensionProbeRateLimit);
export const generalPageRequestLimiter = new RateLimiter(Rule34NetworkConfig.generalPageRequestRateLimit);

export const favoriteAddThrottle = new ThrottleQueue(Rule34NetworkConfig.favoriteAddThrottle);
export const favoriteRemoveThrottle = new ThrottleQueue(Rule34NetworkConfig.favoriteRemoveThrottle);
