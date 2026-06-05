import { Favorite } from "@/types/favorite";
import { Preferences } from "@/app/context/preferences";
import { shuffleArray } from "@/utils/collection/array";

export function sortFavorites(favorites: Favorite[]): Favorite[] {
  const sortKey = Preferences.favoritesSortKey.value;

  if (sortKey === "random") {
    return shuffleArray([...favorites]);
  }
  const sorted = [...favorites].sort((a, b) => b.metrics[sortKey] - a.metrics[sortKey]);
  return Preferences.favoritesSortAscending.value ? sorted.reverse() : sorted;
}
