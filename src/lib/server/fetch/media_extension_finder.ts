import { BRUTE_FORCE_LIMITER } from "./rate_limiter";
import { EXTENSIONS } from "../../environment/constants";
import { Favorite } from "../../../types/favorite";
import { MediaExtension } from "../../../types/media";
import { resolveBaseImageURL } from "../url/media_url_resolver";

async function probeExtensions(item: HTMLElement | Favorite): Promise<MediaExtension | null> {
  const baseUrl = resolveBaseImageURL(item);

  for (const extension of EXTENSIONS) {
    if (await probeExtension(baseUrl, extension)) {
      return extension;
    }
  }
  return null;
}

async function probeExtension(url: string, extension: string): Promise<boolean> {
  const response = await fetch(url.replace(".jpg", `.${extension}`));
  return response.ok;
}

export function findMediaExtension(item: HTMLElement | Favorite): Promise<MediaExtension | null> {
  return BRUTE_FORCE_LIMITER.run(() => {
    return probeExtensions(item);
  });
}
