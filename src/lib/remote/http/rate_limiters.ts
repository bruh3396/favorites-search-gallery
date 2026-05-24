import { ApiConfig } from "../../../config/api_config";
import { ConcurrencyLimiter } from "../../async/concurrency_limiter";
import { Rule34NetworkConfig } from "../../../config/rule34_network_config";
import { ThrottledQueue } from "../../async/throttled_queue";

export const postLimiter = new ConcurrencyLimiter(ApiConfig.postFetchConcurrency);
export const tagLimiter = new ConcurrencyLimiter(ApiConfig.tagFetchConcurrency);
export const extensionProbeLimiter = new ConcurrencyLimiter(Rule34NetworkConfig.extensionProbeConcurrency);
export const extensionProbeQueue = new ThrottledQueue(Rule34NetworkConfig.extensionProbeThrottle);
export const favoriteAddQueue = new ThrottledQueue(Rule34NetworkConfig.favoriteAddThrottle);
export const favoriteRemoveQueue = new ThrottledQueue(Rule34NetworkConfig.favoriteRemoveThrottle);
export const generalPageRequestQueue = new ThrottledQueue(Rule34NetworkConfig.generalPageRequestThrottle);
