import { Favorite } from "@/types/favorite";
import { Preferences } from "@/app/context/preferences";
import { setDataset } from "@/utils/dom/attribute";

export function markAsNew(favorite: Favorite): void {
  setDataset(favorite.root, "highlight", Preferences.favoritesNewFavoriteHighlight.value);
}
