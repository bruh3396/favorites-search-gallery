import { MediaKind } from "@/core/domain/media/media";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { Rule34CdnFileExtension } from "@/adapters/rule34_cdn/client/extension";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { fileUrl } from "@/adapters/rule34_cdn/client/addresses";

export interface Rule34CdnExtensionProberDependencies {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  scheduler: Scheduler;
}

const PROBE_RATE_LIMIT = { concurrency: 3, ratePerSecond: 50 };
const PROBE_ORDERS: Record<MediaKind, readonly Rule34CdnFileExtension[]> = {
  image: ["jpeg", "png", "jpg", "gif", "mp4"],
  gif: ["gif", "mp4", "jpeg", "png", "jpg"],
  video: ["mp4", "gif", "jpeg", "png", "jpg"]
};

export class Rule34CdnExtensionProber {
  private readonly limiter: RateLimiter;
  private readonly probes = new Map<string, Promise<Rule34CdnFileExtension | null>>();

  constructor(private readonly dependencies: Rule34CdnExtensionProberDependencies) {
    this.limiter = new RateLimiter(PROBE_RATE_LIMIT, dependencies.scheduler);
  }

  public probe(locator: string, guess: MediaKind): Promise<Rule34CdnFileExtension | null> {
    const pending = this.probes.get(locator);

    if (pending !== undefined) {
      return pending;
    }
    const probe = this.findExtension(locator, PROBE_ORDERS[guess]);

    this.probes.set(locator, probe);
    void probe.then(extension => {
      if (extension === null) {
        this.probes.delete(locator);
      }
    });
    return probe;
  }

  private async findExtension(locator: string, order: readonly Rule34CdnFileExtension[]): Promise<Rule34CdnFileExtension | null> {
    for (const extension of order) {
      if (await this.exists(fileUrl(locator, extension))) {
        return extension;
      }
    }
    return null;
  }

  private exists(url: string): Promise<boolean> {
    return this.limiter.run(() => this.dependencies.fetch(url, { method: "HEAD" }))
      .then(response => response.ok, () => false);
  }
}
