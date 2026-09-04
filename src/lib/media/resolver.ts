import { DEFAULT_EXTENSION, allImageExtensions, extensionRegex } from "@/lib/media/constants";
import { ImageExtension, MediaExtension, MediaItem } from "@/types/media";
import { imageUrl, imageUrlToSampleUrl, replaceExtension, withExtension } from "@/lib/media/url";
import { isGif, isVideo } from "@/lib/media/type";
import { RateLimiter } from "@/lib/async/rate_limiting";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";

const extensionProbeLimiter = new RateLimiter(Rule34NetworkConfig.extensionProbeRateLimit);
const cache: Map<string, ImageExtension> = new Map();

export const resolveSampleUrl = async(item: MediaItem): Promise<string> => imageUrlToSampleUrl(await resolveImageUrl(item));
export const resolveImageUrl = async(item: MediaItem): Promise<string> => replaceExtension(await resolveMediaUrl(item), "mp4", DEFAULT_EXTENSION);
export const resolveMediaUrl = async(item: MediaItem): Promise<string> => withExtension(imageUrl(item), await resolveExtension(item));

export const extractExtension = (url: string): MediaExtension | null => extensionRegex.exec(url)?.[1] as MediaExtension ?? null;

export async function resolveExtension(item: MediaItem): Promise<MediaExtension> {
  if (isVideo(item)) {
    return Promise.resolve("mp4");
  }

  if (isGif(item)) {
    return Promise.resolve("gif");
  }

  if (item.extension !== undefined) {
    return Promise.resolve(item.extension);
  }
  const cached = cache.get(item.id);

  if (cached !== undefined) {
    return Promise.resolve(cached);
  }
  const extension = await probeAllExtensions(item);

  if (extension !== null) {
    cache.set(item.id, extension);
  }
  return extension ?? DEFAULT_EXTENSION;
}

async function probeAllExtensions(item: MediaItem): Promise<ImageExtension | null> {
  const baseUrl = imageUrl(item);

  for (const extension of allImageExtensions) {
    const cached = cache.get(item.id);

    if (cached !== undefined) {
      return cached;
    }

    if (await probeExtension(baseUrl, extension)) {
      return extension;
    }
  }
  return null;
}

function probeExtension(url: string, extension: ImageExtension): Promise<boolean> {
  return extensionProbeLimiter.run(() => {
    return fetch(withExtension(url, extension), { method: "HEAD" })
      .then(response => response.ok)
      .catch(() => false);
  });
}
