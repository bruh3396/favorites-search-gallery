import * as API from "../../../lib/api/api";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "../../../types/favorite_types";
import { Events } from "../../../lib/global/events/events";

export async function addFavoriteInGallery(thumb: HTMLElement | undefined): Promise<AddFavoriteStatus> {
  if (thumb === undefined) {
    return Promise.resolve(AddFavoriteStatus.ERROR);
  }
  const status = await API.addFavorite(thumb.id);

  if (status === AddFavoriteStatus.SUCCESSFULLY_ADDED) {
    Events.gallery.favoriteToggled.emit(thumb.id);
  }
  return status;
}

export function removeFavoriteInGallery(thumb: HTMLElement | undefined): Promise<RemoveFavoriteStatus> {
  if (thumb === undefined) {
    return Promise.resolve(RemoveFavoriteStatus.ERROR);
  }
  const removeFavoriteButton = thumb.querySelector(".remove-favorite-button");
  const showRemoveFavoriteCheckbox = document.getElementById("show-remove-favorite-buttons");

  if (removeFavoriteButton === null || showRemoveFavoriteCheckbox === null) {
    return Promise.resolve(RemoveFavoriteStatus.ERROR);
  }
  const allowedToRemoveFavorites = (showRemoveFavoriteCheckbox instanceof HTMLInputElement) && showRemoveFavoriteCheckbox.checked;

  if (!allowedToRemoveFavorites) {
    return Promise.resolve(RemoveFavoriteStatus.FORBIDDEN);
  }
  API.removeFavorite(thumb.id);
  Events.gallery.favoriteToggled.emit(thumb.id);
  Events.favorites.favoriteRemoved.emit(thumb.id);
  return Promise.resolve(RemoveFavoriteStatus.SUCCESSFULLY_REMOVED);
}
