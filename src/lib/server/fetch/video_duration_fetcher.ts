import { ConcurrencyLimiter } from "../../core/concurrency/concurrency_limiter";
import { Favorite } from "../../../types/favorite_data_types";
import { resolveBaseImageURL } from "../url/media_url_resolver";

const CONCURRENCY = 3;
const VIDEO_LIMITER = new ConcurrencyLimiter(CONCURRENCY);
const METADATA_BYTE_RANGES = [500_000, 1_000_000, 2_000_000, 4_000_000];
const VIDEO_POOL: HTMLVideoElement[] = Array.from({ length: CONCURRENCY }, () => {
  const v = document.createElement("video");

  v.preload = "metadata";
  return v;
});

export function fetchVideoDurationFromFavorite(favorite: Favorite): Promise<number> {
  return fetchVideoDuration(resolveBaseImageURL(favorite).replace(".jpg", ".mp4"));
}

export function fetchVideoDuration(url: string): Promise<number> {
  return VIDEO_LIMITER.run(() => {
    return fetchVideoDurationWithIncreasingByteRanges(url);
  });
}

function fetchVideoDurationWithIncreasingByteRanges(url: string): Promise<number> {
  let chain = Promise.reject<number>(new Error("start chain"));

  for (const range of METADATA_BYTE_RANGES) {
    chain = chain.catch(() => fetchVideoDurationForRange(url, range));
  }
  return chain.catch(() => Promise.reject(new Error(`Unable to read video duration for ${url} after trying ${METADATA_BYTE_RANGES.map(b => `${b / 1000}KB`).join(", ")}`)));
}

async function fetchVideoDurationForRange(url: string, range: number): Promise<number> {
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
