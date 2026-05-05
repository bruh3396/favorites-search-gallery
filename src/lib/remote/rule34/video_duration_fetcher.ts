import { ConcurrencyLimiter } from "../../core/concurrency/concurrency_limiter";
import { Favorite } from "../../../types/favorite";
import { Rule34NetworkConfig } from "../../../config/rule34_network_config";
import { resolveBaseImageURL } from "../../media/media_url_resolver";

const videoLimiter = new ConcurrencyLimiter(Rule34NetworkConfig.videoDurationFetchConcurrency);
const videoPool: HTMLVideoElement[] = Array.from({ length: Rule34NetworkConfig.videoDurationFetchConcurrency }, () => {
  const video = document.createElement("video");

  video.preload = "metadata";
  return video;
});

export function fetchVideoDurationFromFavorite(favorite: Favorite): Promise<number> {
  return fetchVideoDuration(resolveBaseImageURL(favorite).replace(".jpg", ".mp4"));
}

export function fetchVideoDuration(url: string): Promise<number> {
  return videoLimiter.run(() => fetchVideoDurationWithIncreasingByteRanges(url));
}

function fetchVideoDurationWithIncreasingByteRanges(url: string): Promise<number> {
  let chain = Promise.reject<number>(new Error());

  for (const range of Rule34NetworkConfig.videoDurationMetadataByteRanges) {
    chain = chain.catch(() => fetchVideoDurationForRange(url, range));
  }
  return chain.catch(() => Promise.reject(new Error(`Unable to read video duration: ${url}`)));
}

async function fetchVideoDurationForRange(url: string, range: number): Promise<number> {
  const response = await fetch(url, { headers: { Range: `bytes=0-${range}` } });

  if (!response.ok && response.status !== 206) {
    throw new Error("Range request failed");
  }
  const blob = await response.blob();
  const video = videoPool.find(v => !v.dataset.busy);

  if (video === undefined) {
    throw new Error("No available video element in pool");
  }
  return loadVideoDuration(video, blob);
}

function loadVideoDuration(video: HTMLVideoElement, blob: Blob): Promise<number> {
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
