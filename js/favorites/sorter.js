class PostSorter {

  /**
   * @returns {Boolean}
   */
  static get sortByAscending() {
    const sortFavoritesAscending = document.getElementById("sort-ascending");
    return sortFavoritesAscending === null ? false : sortFavoritesAscending.checked;
  }

  /**
   * @param {Post[]} posts
   * @returns {Post[]}
   */
  static sortSearchResults(posts) {
    const sortedPosts = posts.slice();
    const sortingMethod = Utils.getSortingMethod();

    if (sortingMethod === "random") {
      Utils.shuffleArray(sortedPosts);
    } else {
      PostSorter.sortPosts(sortedPosts, sortingMethod);
    }

    if (PostSorter.sortByAscending) {
      sortedPosts.reverse();
    }
    return sortedPosts;
  }

  /**
   * @param {Post[]} posts
   * @param {String} sortingMethod
   */
  static sortPosts(posts, sortingMethod) {
    if (sortingMethod === "default") {
      return;
    }
    posts.sort((b, a) => {
      switch (sortingMethod) {
        case "score":
          return a.metadata.score - b.metadata.score;

        case "width":
          return a.metadata.width - b.metadata.width;

        case "height":
          return a.metadata.height - b.metadata.height;

        case "create":
          return a.metadata.creationTimestamp - b.metadata.creationTimestamp;

        case "change":
          return a.metadata.lastChangedTimestamp - b.metadata.lastChangedTimestamp;

        case "id":
          return a.metadata.id - b.metadata.id;

        default:
          return 0;
      }
    });
  }
}
