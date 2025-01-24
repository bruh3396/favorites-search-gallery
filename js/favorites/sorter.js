class FavoritesSorter {
  /**
   * @returns {Boolean}
   */
  static get sortByAscending() {
    const sortByAscendingCheckbox = document.getElementById("sort-ascending-checkbox");
    return sortByAscendingCheckbox === null ? false : sortByAscendingCheckbox.checked;
  }

  /**
   * @param {Post[]} posts
   * @returns {Post[]}
   */
  static sort(posts) {
    const postsToSort = posts.slice();
    const sortingMethod = Utils.getSortingMethod();

    if (sortingMethod === "random") {
      return Utils.shuffleArray(postsToSort);
    }
    postsToSort.sort((postA, postB) => {
      return (postB.metadata[sortingMethod] - postA.metadata[sortingMethod]) || 0;
    });
    return FavoritesSorter.sortByAscending ? postsToSort.reverse() : postsToSort;
  }
}
