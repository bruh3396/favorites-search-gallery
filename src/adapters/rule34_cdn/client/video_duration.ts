import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface Rule34CdnVideoDurationReaderDependencies {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  scheduler: Scheduler;
}

const RATE_LIMIT = { concurrency: 3, ratePerSecond: 5 };
const METADATA_BYTE_RANGES = [500_000, 1_000_000, 2_000_000, 4_000_000];

export class Rule34CdnVideoDurationReader {
  private readonly limiter: RateLimiter;
  private readonly idleVideos: HTMLVideoElement[] = [];

  constructor(private readonly dependencies: Rule34CdnVideoDurationReaderDependencies) {
    this.limiter = new RateLimiter(RATE_LIMIT, dependencies.scheduler);
  }

  public readSeconds(url: string): Promise<number> {
    return this.limiter.run(() => this.readWithIncreasingByteRanges(url));
  }

  private readWithIncreasingByteRanges(url: string): Promise<number> {
    let chain = Promise.reject<number>(new Error());

    for (const range of METADATA_BYTE_RANGES) {
      chain = chain.catch(() => this.readRange(url, range));
    }
    return chain.catch(() => Promise.reject(new Error(`Unable to read video duration: ${url}`)));
  }

  private async readRange(url: string, range: number): Promise<number> {
    const response = await this.dependencies.fetch(url, { headers: { Range: `bytes=0-${range}` } });

    if (!response.ok) {
      throw new Error("Range request failed");
    }
    const blob = await response.blob();
    const video = this.idleVideos.pop() ?? createMetadataVideo();

    try {
      return await loadDuration(video, blob);
    } finally {
      this.idleVideos.push(video);
    }
  }
}

function loadDuration(video: HTMLVideoElement, blob: Blob): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    video.onloadedmetadata = (): void => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = (): void => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video metadata"));
    };
    video.src = URL.createObjectURL(blob);
  });
}

function createMetadataVideo(): HTMLVideoElement {
  const video = document.createElement("video");

  video.preload = "metadata";
  return video;
}
