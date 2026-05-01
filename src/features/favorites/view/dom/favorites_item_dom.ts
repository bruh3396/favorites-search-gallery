import { CONTENT } from "../../../../lib/shell";
import { ITEM_SELECTOR } from "../../../../lib/dom/thumb";
import { getFavorite } from "../../type/favorite_item";

export function noFavoritesAreVisible(): boolean {
  return CONTENT.querySelector(ITEM_SELECTOR) === null;
}

export function swapFavoriteButton(id: string): void {
  getFavorite(id)?.swapFavoriteButton();
}
