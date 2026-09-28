import { MediaItem } from "@/types/media";
import { RateLimiter } from "@/lib/async/rate_limiting";
import { videoUrl } from "@/lib/media/url";

const RATE_LIMIT = { concurrency: 3, ratePerSecond: 5 };
const METADATA_BYTE_RANGES = [500_000, 1_000_000, 2_000_000, 4_000_000];

const videoLimiter = new RateLimiter(RATE_LIMIT);
let videoPool: HTMLVideoElement[] | undefined;

export function readVideoDuration(item: MediaItem): Promise<number> {
  return videoLimiter.run(() => readVideoDurationWithIncreasingByteRanges(videoUrl(item)));
}

function readVideoDurationWithIncreasingByteRanges(url: string): Promise<number> {
  let chain = Promise.reject<number>(new Error());

  for (const range of METADATA_BYTE_RANGES) {
    chain = chain.catch(() => readVideoDurationForRange(url, range));
  }
  return chain.catch(() => Promise.reject(new Error(`Unable to read video duration: ${url}`)));
}

async function readVideoDurationForRange(url: string, range: number): Promise<number> {
  const response = await fetch(url, { headers: { Range: `bytes=0-${range}` } });

  if (!response.ok && response.status !== 206) {
    throw new Error("Range request failed");
  }
  const blob = await response.blob();
  const video = getVideoPool().find(v => !v.dataset.busy);

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

function getVideoPool(): HTMLVideoElement[] {
  videoPool ??= Array.from({ length: RATE_LIMIT.concurrency }, createMetadataVideoElement);
  return videoPool;
}

function createMetadataVideoElement(): HTMLVideoElement {
  const video = document.createElement("video");

  video.preload = "metadata";
  return video;
}
