import { Favorite } from "@/types/favorite";
import { setDataset } from "@/utils/browser/dataset";

export function markAsNew(favorites: Favorite[]): void {
  for (const favorite of favorites) {
    setDataset(favorite.root, "newBadge");
  }
}
