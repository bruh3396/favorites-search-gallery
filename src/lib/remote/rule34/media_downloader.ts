import * as ExtensionResolver from "@/lib/media/media_extension_resolver";
import { DEFAULT_EXTENSION } from "@/lib/media/media_constants";
import { download } from "@/utils/browser/download";
import { resolveMediaUrl } from "@/lib/media/media_url_resolver";

export async function downloadFromThumb(thumb: HTMLElement): Promise<void> {
  const url = await resolveMediaUrl(thumb);
  const extension = ExtensionResolver.extractExtensionFromUrl(url) ?? DEFAULT_EXTENSION;
  const filename = `${thumb.id}.${extension}`;

  download(url, filename);
}
