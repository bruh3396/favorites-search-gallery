import * as FavoritesActions from "../../../lib/remote/rule34/favorites_actions";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "../../../types/favorite";
import { Events } from "../../../lib/communication/events";

export async function addFavorite(thumb: HTMLElement | undefined): Promise<AddFavoriteStatus> {
  if (thumb === undefined) {
    return Promise.resolve(AddFavoriteStatus.ERROR);
  }
  const status = await FavoritesActions.addFavorite(thumb.id);

  if (status === AddFavoriteStatus.SUCCESSFULLY_ADDED) {
    Events.gallery.favoriteToggled.emit(thumb.id);
  }
  return status;
}

export function removeFavorite(thumb: HTMLElement | undefined): Promise<RemoveFavoriteStatus> {
  if (thumb === undefined) {
    return Promise.resolve(RemoveFavoriteStatus.ERROR);
  }
  const removeFavoriteButton = thumb.querySelector(".post-action-btn--remove");
  const showRemoveFavoriteCheckbox = document.getElementById("show-remove-favorite-buttons");

  if (removeFavoriteButton === null || showRemoveFavoriteCheckbox === null) {
    return Promise.resolve(RemoveFavoriteStatus.ERROR);
  }
  const allowedToRemoveFavorites = (showRemoveFavoriteCheckbox instanceof HTMLInputElement) && showRemoveFavoriteCheckbox.checked;

  if (!allowedToRemoveFavorites) {
    return Promise.resolve(RemoveFavoriteStatus.FORBIDDEN);
  }
  FavoritesActions.removeFavorite(thumb.id);
  Events.gallery.favoriteToggled.emit(thumb.id);
  Events.favorites.favoriteRemoved.emit(thumb.id);
  return Promise.resolve(RemoveFavoriteStatus.SUCCESSFULLY_REMOVED);
}
