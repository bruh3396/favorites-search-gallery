import * as PostStore from "@/lib/domain/post/store";
import { Favorite } from "@/types/favorite";
import { MediaItem } from "@/types/media";
import { RateLimiter } from "@/lib/async/rate_limiting";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { videoUrl } from "@/lib/media/url";

export class FavoritesDurationEnricher {
  private readonly videoLimiter = new RateLimiter(Rule34NetworkConfig.videoDurationRateLimit);
  private readonly videoPool: HTMLVideoElement[] = Array.from({ length: Rule34NetworkConfig.videoDurationRateLimit.concurrency }, createMetadataVideoElement);

  constructor(private readonly onFavoriteEnriched: (favorite: Favorite) => void) {}

  public enrich(favorites: Favorite[]): void {
    favorites.forEach(favorite => {
      this.fetchVideoDuration(favorite)
        .then(duration => {
          favorite.setDuration(duration);
          PostStore.write(favorite.post);
          this.onFavoriteEnriched(favorite);
        }).catch(console.error);
    });
  }

  private fetchVideoDuration(mediaItem: MediaItem): Promise<number> {
    return this.videoLimiter.run(() => this.fetchVideoDurationWithIncreasingByteRanges(videoUrl(mediaItem)));
  }

  private fetchVideoDurationWithIncreasingByteRanges(url: string): Promise<number> {
    let chain = Promise.reject<number>(new Error());

    for (const range of Rule34NetworkConfig.videoDurationMetadataByteRanges) {
      chain = chain.catch(() => this.fetchVideoDurationForRange(url, range));
    }
    return chain.catch(() => Promise.reject(new Error(`Unable to read video duration: ${url}`)));
  }

  private async fetchVideoDurationForRange(url: string, range: number): Promise<number> {
    const response = await fetch(url, { headers: { Range: `bytes=0-${range}` } });

    if (!response.ok && response.status !== 206) {
      throw new Error("Range request failed");
    }
    const blob = await response.blob();
    const video = this.videoPool.find(v => !v.dataset.busy);

    if (video === undefined) {
      throw new Error("No available video element in pool");
    }
    return this.loadVideoDuration(video, blob);
  }

  private loadVideoDuration(video: HTMLVideoElement, blob: Blob): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      video.dataset.busy = "true";
      video.onloadedmetadata = (): void => {
        URL.revokeObjectURL(video.src);
        video.dataset.busy = "";
        resolve(video.duration);
      };
      video.onerror = (): void => {
        URL.revokeObjectURL(video.src);
        video.dataset.busy = "";
        reject(new Error("Failed to load video metadata"));
      };
      video.src = URL.createObjectURL(blob);
    });
  }
}

function createMetadataVideoElement(): HTMLVideoElement {
  const video = document.createElement("video");

  video.preload = "metadata";
  return video;
}
