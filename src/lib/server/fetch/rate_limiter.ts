import { ConcurrencyLimiter } from "../../core/concurrency/concurrency_limiter";
import { ThrottledQueue } from "../../core/concurrency/throttled_queue";

export const MULTI_POST_LIMITER = new ConcurrencyLimiter(4);
export const POST_LIMITER = new ConcurrencyLimiter(250);

export const TAG_LIMITER = new ConcurrencyLimiter(100);

export const GENERAL_PAGE_REQUEST_QUEUE = new ThrottledQueue(2000);

export const FAVORITES_PAGE_LIMITER = new ConcurrencyLimiter(2);
export const FAVORITE_REMOVE_QUEUE = new ThrottledQueue(1000);
export const FAVORITE_ADD_QUEUE = new ThrottledQueue(200);
export const BRUTE_FORCE_LIMITER = new ConcurrencyLimiter(3);
