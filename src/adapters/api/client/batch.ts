import { CoalescingResolver } from "@/lib/async/coalescing";
import { RateLimiter } from "@/lib/async/rate_limiting";
import { RateLimiterConfig } from "@/types/async";

const COALESCE_SIZE = 50;
const FLUSH_TIMEOUT = 2000;

// Collects keys asked for close together into one rate-limited request.
export class BatchedRequests<Answer> {
  private readonly limiter: RateLimiter;
  private readonly resolver: CoalescingResolver<string, Answer>;

  constructor(rateLimit: RateLimiterConfig, send: (keys: string[]) => Promise<Record<string, Answer>>) {
    this.limiter = new RateLimiter(rateLimit);
    this.resolver = new CoalescingResolver(COALESCE_SIZE, FLUSH_TIMEOUT, keys => this.limiter.run(async() => new Map(Object.entries(await send(keys)))));
  }

  public schedule(key: string): Promise<Answer> {
    return this.resolver.schedule(key);
  }
}
