import * as FavoritesActions from "@/lib/remote/rule34/favorites/actions";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "@/types/favorite";

export function addFavoriteFromThumb(thumb: HTMLElement | undefined): Promise<AddFavoriteStatus> {
  return thumb === undefined ? Promise.resolve("error") : FavoritesActions.addFavorite(thumb.id);
}

export function removeFavoriteFromThumb(thumb: HTMLElement | undefined): Promise<RemoveFavoriteStatus> {
  if (thumb === undefined) {
    return Promise.resolve("error");
  }
  FavoritesActions.removeFavorite(thumb.id);
  return Promise.resolve("success");
}
