import { FrozenCobaltEndpoints, FrozenCobaltPostResult, FrozenCobaltTagResult, parseBatch, parsePostResult, parseTagResult } from "@/adapters/frozen_cobalt/client/schema";
import { CoalescingResolver } from "@/core/utils/async/coalescing";
import { FrozenCobaltError } from "@/adapters/frozen_cobalt/client/error";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface FrozenCobaltIdentity {
  userId: string;
  version: string;
  platform: string;
}

export interface FrozenCobaltClientConfiguration {
  origin: string;
  identity?: FrozenCobaltIdentity;
}

export interface FrozenCobaltClientDependencies {
  scheduler: Scheduler;
  fetch: (url: string, init: RequestInit) => Promise<Response>;
}

type FrozenCobaltEndpoint = keyof FrozenCobaltEndpoints;
type Resolved = Map<string, unknown>;

const REQUEST_TIMEOUT = 10_000;
const REQUEST_COALESCING = { flushSize: 50, flushTimeout: 2_000 };
const POST_RATE_LIMIT = { concurrency: 4, ratePerSecond: 2 };
const TAG_RATE_LIMIT = { concurrency: 4, ratePerSecond: 10 };

export class FrozenCobaltClient {
  private readonly postResolver: CoalescingResolver<string, unknown>;
  private readonly tagResolver: CoalescingResolver<string, unknown>;
  private readonly headers: Record<string, string>;

  constructor(
    private readonly configuration: FrozenCobaltClientConfiguration,
    private readonly dependencies: FrozenCobaltClientDependencies
  ) {
    const postLimiter = new RateLimiter(POST_RATE_LIMIT, dependencies.scheduler);
    const tagLimiter = new RateLimiter(TAG_RATE_LIMIT, dependencies.scheduler);

    this.headers = {
      "Content-Type": "application/json",
      "X-User-Id": configuration.identity?.userId ?? "",
      "X-Version": configuration.identity?.version ?? "",
      "X-Platform": configuration.identity?.platform ?? ""
    };
    this.postResolver = new CoalescingResolver(REQUEST_COALESCING, {
      resolve: (ids): Promise<Resolved> => postLimiter.run(() => this.requestBatch("post", { ids }, ids)),
      scheduler: dependencies.scheduler
    });
    this.tagResolver = new CoalescingResolver(REQUEST_COALESCING, {
      resolve: (tagNames): Promise<Resolved> => tagLimiter.run(() => this.requestBatch("tag", { tagNames }, tagNames)),
      scheduler: dependencies.scheduler
    });
  }

  public ping(): void {
    this.request("ping", {}).catch(() => { });
  }

  public async fetchPost(id: string): Promise<FrozenCobaltPostResult> {
    return parsePostResult(await this.postResolver.schedule(id), id);
  }

  public async fetchTagCategory(tagName: string): Promise<FrozenCobaltTagResult> {
    return parseTagResult(await this.tagResolver.schedule(tagName), tagName);
  }

  private async requestBatch<E extends FrozenCobaltEndpoint>(
    endpoint: E,
    body: FrozenCobaltEndpoints[E],
    keys: string[]
  ): Promise<Resolved> {
    const results = parseBatch(await this.request(endpoint, body));
    return new Map(keys.map(key => [key, results[key]]));
  }

  private async request<E extends FrozenCobaltEndpoint>(endpoint: E, body: FrozenCobaltEndpoints[E]): Promise<string> {
    const abortController = new AbortController();
    const cancelTimeout = this.dependencies.scheduler.schedule(() => abortController.abort(), REQUEST_TIMEOUT);

    try {
      const response = await this.dependencies.fetch(`${this.configuration.origin}/${endpoint}`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new FrozenCobaltError("http", { status: response.status });
      }
      return await response.text();
    } catch (cause) {
      if (cause instanceof FrozenCobaltError) {
        throw cause;
      }
      throw new FrozenCobaltError(abortController.signal.aborted ? "timeout" : "network", { cause });
    } finally {
      cancelTimeout();
    }
  }
}
