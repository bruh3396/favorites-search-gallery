import { extensionProbeLimiter, extensionProbeQueue } from "@/lib/remote/http/rate_limiters";
import { Favorite } from "@/types/favorite";
import { ImageExtension } from "@/types/media";
import { allImageExtensions } from "@/lib/media/constants";
import { baseImageUrl } from "@/lib/media/base_image_url";

export async function probeAllExtensions(item: HTMLElement | Favorite): Promise<ImageExtension | null> {
  await extensionProbeQueue.wait();
  const baseUrl = baseImageUrl(item);

  for (const extension of allImageExtensions) {
    if (await probeExtension(baseUrl, extension)) {
      return extension;
    }
  }
  return null;
}

function probeExtension(url: string, extension: ImageExtension): Promise<boolean> {
  return extensionProbeLimiter.run(async() => {
    const response = await fetch(url.replace(".jpg", `.${extension}`), { method: "HEAD" }).catch();
    return response.ok;
  });
}
