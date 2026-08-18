import { Favorite } from "@/types/favorite";
import { Preferences } from "@/app/context/preferences";
import { setDataset } from "@/utils/platform/dataset";

export function markAsNew(favorites: Favorite[]): void {
  for (const favorite of favorites) {
    setDataset(favorite.root, "highlight", Preferences.favorites.newFavoriteHighlight.value);
  }
}
