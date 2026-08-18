import * as ExtensionResolver from "@/lib/media/extension_resolver";
import { DEFAULT_EXTENSION } from "@/lib/media/constants";
import { download } from "@/utils/platform/browser";
import { resolveMediaUrl } from "@/lib/media/url_resolver";
import { toMediaItem } from "@/lib/thumb/item";

export async function downloadFromThumb(thumb: HTMLElement): Promise<void> {
  const url = await resolveMediaUrl(toMediaItem(thumb));
  const extension = ExtensionResolver.extractExtension(url) ?? DEFAULT_EXTENSION;
  const filename = `${thumb.id}.${extension}`;

  download(url, filename);
}
