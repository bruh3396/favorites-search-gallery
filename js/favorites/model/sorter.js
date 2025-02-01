class FavoritesSorter {
  /**
   * @type {Boolean}
   */
  static get sortByAscending() {
    const sortByAscendingCheckbox = document.getElementById("sort-ascending");

    if (sortByAscendingCheckbox !== null && sortByAscendingCheckbox instanceof HTMLInputElement) {
        return sortByAscendingCheckbox.checked;
    }
    return false;
  }

  /**
   * @type {String}
   */
  static get sortingMethod() {
    const sortingMethodSelect = document.getElementById("sorting-method");

    if (sortingMethodSelect !== null && sortingMethodSelect instanceof HTMLSelectElement) {
      return sortingMethodSelect.value;
    }
    return "default";
  }

  /**
   * @param {Post[]} posts
   * @returns {Post[]}
   */
  static sort(posts) {
    const postsToSort = posts.slice();
    const sortingMethod = FavoritesSorter.sortingMethod;

    if (sortingMethod === "random") {
      return Utils.shuffleArray(postsToSort);
    }
    postsToSort.sort((postA, postB) => {
      // @ts-ignore
      return (postB.metadata[sortingMethod] - postA.metadata[sortingMethod]) || 0;
    });
    return FavoritesSorter.sortByAscending ? postsToSort.reverse() : postsToSort;
  }
}
