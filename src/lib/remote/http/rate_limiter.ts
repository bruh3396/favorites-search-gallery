import { ConcurrencyLimiter } from "../../core/concurrency/concurrency_limiter";
import { ThrottledQueue } from "../../core/concurrency/throttled_queue";

export const postLimiter = new ConcurrencyLimiter(4);
export const tagLimiter = new ConcurrencyLimiter(4);

export const favoriteAddQueue = new ThrottledQueue(200);
export const FavoriteRemoveQueue = new ThrottledQueue(1000);
export const generalPageRequestQueue = new ThrottledQueue(2000);
