import { ImageExtension } from "@/adapters/rule34/client/media/extension";
import { RateLimiter } from "@/lib/async/rate_limiting";
import { fileUrl } from "@/adapters/rule34/client/media/addresses";

const PROBE_RATE_LIMIT = { concurrency: 3, ratePerSecond: 50 };
const PROBED_EXTENSIONS: readonly ImageExtension[] = ["jpeg", "png", "jpg"];
const FALLBACK_EXTENSION: ImageExtension = "jpg";

export class ExtensionProber {
  private readonly limiter = new RateLimiter(PROBE_RATE_LIMIT);
  private readonly found = new Map<string, ImageExtension>();

  public async probe(locator: string): Promise<ImageExtension> {
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
    return this.limiter.run(() => fetch(url, { method: "HEAD" }).then(response => response.ok, () => false));
  }
}
