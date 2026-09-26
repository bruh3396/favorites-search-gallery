import * as MediaResolver from "@/lib/media/resolver";
import { DEFAULT_EXTENSION } from "@/lib/media/constants";
import { MediaItem } from "@/types/media";
import { downloadFromUrl } from "@/utils/browser/download";

export async function downloadMedia(item: MediaItem): Promise<void> {
  const url = await MediaResolver.resolveMediaUrl(item);
  const extension = MediaResolver.extractExtension(url) ?? DEFAULT_EXTENSION;
  const filename = `${item.id}.${extension}`;

  downloadFromUrl(url, filename);
}
