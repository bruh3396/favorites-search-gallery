import { Favorite } from "../../../../types/favorite";

export function swapFavoriteButton(favorite: Favorite | undefined): void {
  favorite?.swapFavoriteButton();
}
