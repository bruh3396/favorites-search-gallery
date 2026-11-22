import { Favorite } from "@/types/favorite";
import { RateLimiter } from "@/lib/async/rate_limiting";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { videoUrl } from "@/lib/media/url";

const videoLimiter = new RateLimiter(Rule34NetworkConfig.videoDurationRateLimit);
const videoPool: HTMLVideoElement[] = Array.from({ length: Rule34NetworkConfig.videoDurationRateLimit.concurrency }, () => {
  const video = document.createElement("video");

  video.preload = "metadata";
  video.muted = true;
  return video;
});

export function fetchVideoDurationFromFavorite(favorite: Favorite): Promise<number> {
  return fetchVideoDuration(videoUrl(favorite));
}

export function fetchVideoDuration(url: string): Promise<number> {
  return videoLimiter.run(() => loadVideoDurationFromPool(url));
}

async function loadVideoDurationFromPool(url: string): Promise<number> {
  const video = videoPool.find(v => !v.dataset.busy);

  if (video === undefined) {
    throw new Error("No available video element in pool");
  }

  try {
    return await loadVideoDuration(video, url);
  } catch {
    throw new Error(`Unable to read video duration: ${url}`);
  } finally {
    video.removeAttribute("src");
    video.load();
    video.dataset.busy = "";
  }
}

function loadVideoDuration(video: HTMLVideoElement, url: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    video.dataset.busy = "true";
    video.onloadedmetadata = (): void => resolve(video.duration);
    video.onerror = (): void => reject(new Error("Failed to load video metadata"));
    video.src = url;
  });
}
