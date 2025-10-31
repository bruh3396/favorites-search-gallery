import { ConcurrencyLimiter } from "../components/concurrency_limiter";
import { Favorite } from "../../types/favorite_types";
import { getOriginalImageURLWithJPGExtension } from "./api_content";

const CONCURRENCY = 5;
const VIDEO_LIMITER = new ConcurrencyLimiter(CONCURRENCY);
const METADATA_BYTE_RANGES = [500_000, 1_000_000, 2_000_000, 4_000_000];
const VIDEO_POOL: HTMLVideoElement[] = Array.from({ length: CONCURRENCY }, () => {
  const v = document.createElement("video");

  v.preload = "metadata";
  return v;
});

export function getVideoDurationFromFavorite(favorite: Favorite): Promise<number> {
  return getVideoDuration(getOriginalImageURLWithJPGExtension(favorite).replace(".jpg", ".mp4"));
}

export function getVideoDuration(url: string): Promise<number> {
  return VIDEO_LIMITER.run(() => {
    return getVideoDurationWithIncreasingByteRanges(url);
  });
}

function getVideoDurationWithIncreasingByteRanges(url: string): Promise<number> {
  let chain = Promise.reject<number>(new Error("start chain"));

  for (const range of METADATA_BYTE_RANGES) {
    chain = chain.catch(() => getVideoDurationForRange(url, range));
  }
  return chain.catch(() => Promise.reject(new Error(`Unable to read video duration for ${url} after trying ${METADATA_BYTE_RANGES.map(b => `${b / 1000}KB`).join(", ")}`)));
}

async function getVideoDurationForRange(url: string, range: number): Promise<number> {
  const response: Response = await fetch(url, { headers: { Range: `bytes=0-${range}` } });

  if (!response.ok && response.status !== 206) {
    throw new Error("Server does not support range requests or fetch failed.");
  }
  const blob: Blob = await response.blob();
  return new Promise<number>((resolve, reject): void => {
    const video = VIDEO_POOL.find(v => !v.dataset.busy)!;

    video.dataset.busy = "true";
    video.preload = "metadata";
    video.onloadedmetadata = (): void => {
      URL.revokeObjectURL(video.src);
      video.dataset.busy = "";
      resolve(video.duration);
    };
    video.onerror = (): void => {
      video.dataset.busy = "";
      reject(new Error("Failed to load video metadata"));
    };

    video.src = URL.createObjectURL(blob);
  });
}
