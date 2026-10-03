import { Rule34Fetch, send } from "@/adapters/rule34/client/request";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { Rule34ImageExtension } from "@/adapters/rule34/client/media/extension";
import { Scheduler } from "@/core/boundary/ports/scheduler";
import { fileUrl } from "@/adapters/rule34/client/media/addresses";

export interface Rule34ExtensionProberDependencies {
  fetch: Rule34Fetch;
  scheduler: Scheduler;
}

const PROBE_RATE_LIMIT = { concurrency: 3, ratePerSecond: 50 };
const PROBED_EXTENSIONS: readonly Rule34ImageExtension[] = ["jpeg", "png", "jpg"];
const FALLBACK_EXTENSION: Rule34ImageExtension = "jpg";

export class Rule34ExtensionProber {
  private readonly limiter: RateLimiter;
  private readonly found = new Map<string, Rule34ImageExtension>();

  constructor(private readonly dependencies: Rule34ExtensionProberDependencies) {
    this.limiter = new RateLimiter(PROBE_RATE_LIMIT, dependencies.scheduler);
  }

  public async probe(locator: string): Promise<Rule34ImageExtension> {
    const cached = this.found.get(locator);

    if (cached !== undefined) {
      return cached;
    }

    for (const extension of PROBED_EXTENSIONS) {
      if (await this.exists(fileUrl(locator, extension))) {
        this.found.set(locator, extension);
        return extension;
      }
    }
    return FALLBACK_EXTENSION;
  }

  private exists(url: string): Promise<boolean> {
    return this.limiter.run(() => send(this.dependencies.fetch, url, { method: "HEAD" }))
      .then(response => response.ok, () => false);
  }
}
