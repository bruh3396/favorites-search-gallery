import { FavoriteItem } from "../../types/favorite/favorite_item";

export function resetTagModifications(favorites: FavoriteItem[]): void {
  for (const favorite of favorites) {
    favorite.resetAdditionalTags();
  }
}
