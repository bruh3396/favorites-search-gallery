import { Favorite } from "../../../types/favorite";
import { MediaExtension } from "../../../types/media";
import { extensionProbeLimiter } from "./rate_limiter";
import { resolveBaseImageURL } from "../url/media_url_resolver";

const extensions: MediaExtension[] = ["jpg", "png", "jpeg"];

async function probeExtensions(item: HTMLElement | Favorite): Promise<MediaExtension | null> {
  const baseUrl = resolveBaseImageURL(item);

  for (const extension of extensions) {
    if (await probeExtension(baseUrl, extension)) {
      return extension;
    }
  }
  return null;
}

async function probeExtension(url: string, extension: string): Promise<boolean> {
  const response = await fetch(url.replace(".jpg", `.${extension}`)).catch();
  return response.ok;
}

export function findMediaExtension(item: HTMLElement | Favorite): Promise<MediaExtension | null> {
  return extensionProbeLimiter.run(() => {
    return probeExtensions(item);
  });
}
