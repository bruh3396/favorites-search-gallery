import { convertPreviewURLToImageURL, removeIdFromImageURL } from "./media_url_transformer";
import { Favorite } from "../../../types/favorite_data_types";
import { getExtension } from "../../extension_cache";
import { getPreviewURL } from "../../../utils/dom/dom";

export async function resolveImageURL(item: HTMLElement | Favorite): Promise<string> {
  return (await resolveContentURL(item)).replace(".mp4", ".jpg");
}

export async function resolveContentURL(item: HTMLElement | Favorite): Promise<string> {
  return resolveBaseImageURL(item).replace(".jpg", `.${await getExtension(item)}`);
}

export function resolveBaseImageURL(item: HTMLElement | Favorite): string {
  return removeIdFromImageURL(convertPreviewURLToImageURL(getPreviewURL(item) ?? ""));
}
