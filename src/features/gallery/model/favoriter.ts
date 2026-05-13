import * as FavoritesActions from "../../../lib/remote/rule34/favorites_actions";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "../../../types/favorite";
import { Preferences } from "../../../lib/preferences/preferences";

export function addFavorite(thumb: HTMLElement | undefined): Promise<AddFavoriteStatus> {
  return thumb === undefined ? Promise.resolve(AddFavoriteStatus.Error) : FavoritesActions.addFavorite(thumb.id);
}

export function removeFavorite(thumb: HTMLElement | undefined): Promise<RemoveFavoriteStatus> {
  if (thumb === undefined) {
    return Promise.resolve(RemoveFavoriteStatus.Error);
  }

  if (!Preferences.removeButtonsVisible.value) {
    return Promise.resolve(RemoveFavoriteStatus.Forbidden);
  }
  FavoritesActions.removeFavorite(thumb.id);
  return Promise.resolve(RemoveFavoriteStatus.Success);
}
