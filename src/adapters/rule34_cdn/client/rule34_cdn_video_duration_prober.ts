import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface Rule34CdnVideoDurationProberDependencies {
  scheduler: Scheduler;
}

const RATE_LIMIT = { concurrency: 3, ratePerSecond: 5 };

export class Rule34CdnVideoDurationProber {
  private readonly rateLimiter: RateLimiter;
  private readonly idleVideos: HTMLVideoElement[] = [];

  constructor(dependencies: Rule34CdnVideoDurationProberDependencies) {
    this.rateLimiter = new RateLimiter(RATE_LIMIT, dependencies.scheduler);
  }

  public probeSeconds(url: string): Promise<number> {
    return this.rateLimiter.run(() => this.probe(url));
  }

  private async probe(url: string): Promise<number> {
    const video = this.idleVideos.pop() ?? createMetadataVideo();

    try {
      return await loadDuration(video, url);
    } catch {
      throw new Error(`Unable to probe video duration: ${url}`);
    } finally {
      video.removeAttribute("src");
      video.load();
      this.idleVideos.push(video);
    }
  }
}

function loadDuration(video: HTMLVideoElement, url: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    video.onloadedmetadata = (): void => resolve(video.duration);
    video.onerror = (): void => reject(new Error("Failed to load video metadata"));
    video.src = url;
  });
}

function createMetadataVideo(): HTMLVideoElement {
  const video = document.createElement("video");

  video.preload = "metadata";
  video.muted = true;
  return video;
}
