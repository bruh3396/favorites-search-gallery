import { convertPreviewUrlToImageUrl, removeIdFromImageUrl } from "./media_url_transformer";
import { Favorite } from "../../types/favorite";
import { getPreviewUrl } from "../ui/dom";

export function baseImageUrl(item: HTMLElement | Favorite): string {
  return removeIdFromImageUrl(convertPreviewUrlToImageUrl(getPreviewUrl(item) ?? ""));
}
