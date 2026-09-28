import { ApiConfig } from "@/adapters/api/client/api_config";
import { CoalescingResolver } from "@/lib/async/coalescing";
import { RateLimiter } from "@/lib/async/rate_limiting";
import { RateLimiterConfig } from "@/types/async";
import { fetchApi, Route } from "@/adapters/api/client/api";

export abstract class AbstractApiFetcher<Response> {
  private readonly limiter: RateLimiter;
  private readonly resolver: CoalescingResolver<string, Response>;

  constructor(rateLimit: RateLimiterConfig, private readonly route: Route, private readonly keysName: string) {
    this.limiter = new RateLimiter(rateLimit);
    this.resolver = new CoalescingResolver(ApiConfig.coalesceSize, ApiConfig.flushTimeout, keys => this.limiter.run(() => this.fetchRecord(keys)));
  }

  protected schedule(key: string): Promise<Response> {
    return this.resolver.schedule(key);
  }

  private async fetchRecord(keys: string[]): Promise<Map<string, Response>> {
    const response = await fetchApi(this.route, { [this.keysName]: keys });
    return new Map(Object.entries(await response.json() as Record<string, Response>));
  }
}
