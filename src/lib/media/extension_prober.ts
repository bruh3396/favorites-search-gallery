import { ImageExtension, MediaItem } from "@/types/media";
import { allImageExtensions } from "@/lib/media/constants";
import { extensionProbeLimiter } from "@/lib/remote/http/rate_limiters";
import { imageUrl } from "@/lib/thumb/url";
import { withExtension } from "@/lib/media/url_transformer";

export async function probeAllExtensions(item: MediaItem): Promise<ImageExtension | null> {
  const baseUrl = imageUrl(item);

  for (const extension of allImageExtensions) {
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
