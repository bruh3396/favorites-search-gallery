class FavoritesSorter {
  /**
   * @type {Boolean}
   */
  useAscendingOrder;
  /**
   * @type {String}
   */
  sortingMethod;

  constructor() {
    this.useAscendingOrder = Boolean(Utils.getPreference("sortAscending", false));
    this.sortingMethod = Utils.getPreference("sortingMethod", "default");
  }

  /**
   * @param {Boolean} value
   */
  setAscendingOrder(value) {
    this.useAscendingOrder = value;
  }

  /**
   * @param {String} value
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
      return (postB.metadata[this.sortingMethod] - postA.metadata[this.sortingMethod]) || 0;
    });
    return this.useAscendingOrder ? postsToSort.reverse() : postsToSort;
  }
}
