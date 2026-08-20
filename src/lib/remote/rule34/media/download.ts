import * as MediaResolver from "@/lib/media/resolver";
import { DEFAULT_EXTENSION } from "@/lib/media/constants";
import { downloadFromUrl } from "@/utils/browser/download";
import { toMediaItem } from "@/lib/thumb/item";

export async function downloadFromThumb(thumb: HTMLElement): Promise<void> {
  const url = await MediaResolver.resolveMediaUrl(toMediaItem(thumb));
  const extension = MediaResolver.extractExtension(url) ?? DEFAULT_EXTENSION;
  const filename = `${thumb.id}.${extension}`;

  downloadFromUrl(url, filename);
}
