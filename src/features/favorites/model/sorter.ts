import {FavoriteI} from "../types/favorite/interfaces";
import Preferences from "../../../store/preferences/preferences";
import {SortingMethod} from "../../../types/primitives/primitives";
import {shuffleArray} from "../../../utils/array/array";

let useAscendingOrder = Preferences.sortAscending.value;
let sortingMethod: SortingMethod = Preferences.sortingMethod.value;

function setAscendingOrder(value: boolean): void {
  useAscendingOrder = value;
}

function setSortingMethod(value: SortingMethod): void {
  sortingMethod = value;
}

function sortFavorites(favorites: FavoriteI[]): FavoriteI[] {
  const toSort = favorites.slice();

  if (sortingMethod === "random") {
    return shuffleArray(toSort);
  }
  toSort.sort((postA, postB) => {
    return (postB.metadata.getMetric(sortingMethod) - postA.metadata.getMetric(sortingMethod));
  });
  return useAscendingOrder ? toSort.reverse() : toSort;
}

const sorter = {
  setAscendingOrder,
  setSortingMethod,
  sortFavorites
};

export default sorter;
