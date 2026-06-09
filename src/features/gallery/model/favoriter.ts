import * as FavoritesActions from "@/lib/remote/rule34/favorites/actions";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "@/types/favorite";
import { Preferences } from "@/app/context/preferences";

export function addFavorite(thumb: HTMLElement | undefined): Promise<AddFavoriteStatus> {
  return thumb === undefined ? Promise.resolve("error") : FavoritesActions.addFavorite(thumb.id);
}

export function removeFavorite(thumb: HTMLElement | undefined): Promise<RemoveFavoriteStatus> {
  if (thumb === undefined) {
    return Promise.resolve("error");
  }

  if (!Preferences.favoritesRemoveButtonsVisible.value) {
    return Promise.resolve("forbidden");
  }
  FavoritesActions.removeFavorite(thumb.id);
  return Promise.resolve("success");
}
