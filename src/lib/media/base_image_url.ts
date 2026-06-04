import { convertPreviewUrlToImageUrl, removeIdFromImageUrl } from "@/lib/media/media_url_transformer";
import { Favorite } from "@/types/favorite";
import { getPreviewUrl } from "@/lib/thumb/thumbs";

export function baseImageUrl(item: HTMLElement | Favorite): string {
  return removeIdFromImageUrl(convertPreviewUrlToImageUrl(getPreviewUrl(item) ?? ""));
}
