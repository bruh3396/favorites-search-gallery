import { AddFavoriteStatus, RemoveFavoriteStatus } from "@/types/favorite";
import { addFavorite, removeFavorite } from "@/lib/remote/actions";

export function addFavoriteFromThumb(thumb: HTMLElement | undefined): Promise<AddFavoriteStatus> {
  return thumb === undefined ? Promise.resolve("error") : addFavorite(thumb.id);
}

export function removeFavoriteFromThumb(thumb: HTMLElement | undefined): Promise<RemoveFavoriteStatus> {
  if (thumb === undefined) {
    return Promise.resolve("error");
  }
  removeFavorite(thumb.id);
  return Promise.resolve("success");
}
