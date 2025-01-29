class FavoritesSorter {
  /**
   * @type {Boolean}
   */
  static get sortByAscending() {
    const sortByAscendingCheckbox = document.getElementById("sort-ascending");
    return sortByAscendingCheckbox === null ? false : sortByAscendingCheckbox.checked;
  }

  /**
   * @type {String}
   */
  static get sortingMethod() {
    const sortingMethodSelect = document.getElementById("sorting-method");
    return sortingMethodSelect === null ? "default" : sortingMethodSelect.value;
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
      return (postB.metadata[sortingMethod] - postA.metadata[sortingMethod]) || 0;
    });
    return FavoritesSorter.sortByAscending ? postsToSort.reverse() : postsToSort;
  }
}
