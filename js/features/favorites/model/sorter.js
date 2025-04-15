class FavoritesSorter {
  /** @type {Boolean} */
  useAscendingOrder;
  /** @type {MetadataMetric} */
  sortingMethod;

  constructor() {
    this.useAscendingOrder = Preferences.sortAscending.value;
    this.sortingMethod = Preferences.sortingMethod.value;
  }

  /**
   * @param {Boolean} value
   */
  setAscendingOrder(value) {
    this.useAscendingOrder = value;
  }

  /**
   * @param {MetadataMetric} value
   */
  setSortingMethod(value) {
    this.sortingMethod = value;
  }

  /**
   * @param {Post[]} favorites
   * @returns {Post[]}
   */
  sortFavorites(favorites) {
    const postsToSort = favorites.slice();

    if (this.sortingMethod === "random") {
      return Utils.shuffleArray(postsToSort);
    }
    postsToSort.sort((postA, postB) => {
      return (postB.metadata.getMetric(this.sortingMethod) - postA.metadata.getMetric(this.sortingMethod));
    });
    return this.useAscendingOrder ? postsToSort.reverse() : postsToSort;
  }
}
