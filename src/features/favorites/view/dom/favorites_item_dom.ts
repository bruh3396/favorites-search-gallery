import { Content } from "../../../../lib/shell";
import { Favorite } from "../../../../types/favorite";
import { ITEM_SELECTOR } from "../../../../lib/dom/thumb";

export function noFavoritesAreVisible(): boolean {
  return Content.querySelector(ITEM_SELECTOR) === null;
}

export function swapFavoriteButton(favorite: Favorite | undefined): void {
  favorite?.swapFavoriteButton();
}
