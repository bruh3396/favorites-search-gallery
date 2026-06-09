import { Favorite } from "@/types/favorite";
import { setDataset } from "@/utils/dom/attribute";

export function markAsNew(favorite: Favorite): void {
  setDataset(favorite.root, "new");
}
