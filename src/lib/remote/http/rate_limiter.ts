import { ConcurrencyLimiter } from "../../core/concurrency/concurrency_limiter";
import { ServerSettings } from "../../../config/server_settings";
import { ThrottledQueue } from "../../core/concurrency/throttled_queue";

export const postLimiter = new ConcurrencyLimiter(ServerSettings.postFetchConcurrency);
export const tagLimiter = new ConcurrencyLimiter(ServerSettings.tagFetchConcurrency);
export const extensionProbeLimiter = new ConcurrencyLimiter(ServerSettings.extensionProbeConcurrency);
export const extensionProbeQueue = new ThrottledQueue(ServerSettings.extensionProbeThrottle);

export const favoriteAddQueue = new ThrottledQueue(ServerSettings.favoriteAddThrottle);
export const favoriteRemoveQueue = new ThrottledQueue(ServerSettings.favoriteRemoveThrottle);
export const generalPageRequestQueue = new ThrottledQueue(ServerSettings.generalPageRequestThrottle);
