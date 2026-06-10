import * as ExtensionResolver from "@/lib/media/extension_resolver";
import { DEFAULT_EXTENSION } from "@/lib/media/constants";
import { download } from "@/utils/browser/download";
import { resolveMediaUrl } from "@/lib/media/url_resolver";

export async function downloadFromThumb(thumb: HTMLElement): Promise<void> {
  const url = await resolveMediaUrl(thumb);
  const extension = ExtensionResolver.extractExtension(url) ?? DEFAULT_EXTENSION;
  const filename = `${thumb.id}.${extension}`;

  download(url, filename);
}
