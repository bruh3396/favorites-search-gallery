import { Favorite } from "@/types/favorite";
import { Preferences } from "@/app/context/preferences";
import { shuffleInPlace } from "@/utils/pure/collection";

export function sort(favorites: Favorite[]): Favorite[] {
  const sortKey = Preferences.favorites.sortKey.value;

  if (sortKey === "random") {
    return shuffleInPlace([...favorites]);
  }
  const sorted = [...favorites].sort((a, b) => b.metrics[sortKey] - a.metrics[sortKey]);
  return Preferences.favorites.sortAscending.value ? sorted.reverse() : sorted;
}
