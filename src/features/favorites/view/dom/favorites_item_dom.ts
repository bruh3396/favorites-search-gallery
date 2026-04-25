import { CONTENT_CONTAINER } from "../../../../lib/global/content/content_container";
import { ITEM_SELECTOR } from "../../../../utils/dom/dom";
import { getFavorite } from "../../types/favorite/favorite_item";

export function noFavoritesAreVisible(): boolean {
  return CONTENT_CONTAINER.querySelector(ITEM_SELECTOR) === null;
}

export function swapFavoriteButton(id: string): void {
  getFavorite(id)?.swapFavoriteButton();
}
