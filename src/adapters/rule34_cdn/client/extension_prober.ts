import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { Rule34CdnImageExtension } from "@/adapters/rule34_cdn/client/extension";
import { Scheduler } from "@/core/boundary/ports/scheduler";
import { fileUrl } from "@/adapters/rule34_cdn/client/addresses";

export interface Rule34CdnExtensionProberDependencies {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  scheduler: Scheduler;
}

const PROBE_RATE_LIMIT = { concurrency: 3, ratePerSecond: 50 };
const PROBED_EXTENSIONS: readonly Rule34CdnImageExtension[] = ["jpeg", "png", "jpg"];
const FALLBACK_EXTENSION: Rule34CdnImageExtension = "jpg";

export class Rule34CdnExtensionProber {
  private readonly limiter: RateLimiter;
  private readonly found = new Map<string, Rule34CdnImageExtension>();

  constructor(private readonly dependencies: Rule34CdnExtensionProberDependencies) {
    this.limiter = new RateLimiter(PROBE_RATE_LIMIT, dependencies.scheduler);
  }

  public async probe(locator: string): Promise<Rule34CdnImageExtension> {
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
    return this.limiter.run(() => this.dependencies.fetch(url, { method: "HEAD" }))
      .then(response => response.ok, () => false);
  }
}
