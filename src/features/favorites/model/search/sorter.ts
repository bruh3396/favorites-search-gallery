import { Favorite } from "../../../../types/favorite";
import { Preferences } from "../../../../lib/preferences/preferences";
import { shuffleArray } from "../../../../utils/collection/array";

export function sortFavorites(favorites: Favorite[]): Favorite[] {
  const sortingMethod = Preferences.sortingMethod.value;

  if (sortingMethod === "random") {
    return shuffleArray([...favorites]);
  }
  const sorted = [...favorites].sort((a, b) => b.metrics[sortingMethod] - a.metrics[sortingMethod]);
  return Preferences.sortAscending.value ? sorted.reverse() : sorted;
}
