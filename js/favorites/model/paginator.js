class FavoritesPaginator {
  /**
   * @type {Number}
   */
  currentPageNumber;
  /**
   * @type {Number}
   */
  resultsPerPage;
  /**
   * @type {Post[]}
   */
  favorites;

  /**
   * @type {Number}
   */
  get pageCount() {
    const favoriteCount = this.favorites.length;

    if (favoriteCount === 0) {
      return 1;
    }
    const pageCount = favoriteCount / this.resultsPerPage;

    if (favoriteCount % this.resultsPerPage === 0) {
      return pageCount;
    }
    return Math.floor(pageCount) + 1;
  }

  /**
   * @type {Boolean}
   */
  get onFirstPage() {
    return this.currentPageNumber === 1;
  }

  /**
   * @type {Boolean}
   */
  get onFinalPage() {
    return this.currentPageNumber === this.pageCount;
  }

  /**
   * @type {Boolean}
   */
  get onlyOnePage() {
    return this.onFirstPage && this.onFinalPage;
  }

  /**
   * @type {FavoritesPaginationParameters}
   */
  get paginationParameters() {
    const {start, end} = this.getCurrentPageRange();
    return new FavoritesPaginationParameters(this.currentPageNumber, this.pageCount, this.favorites.length, start, end);
  }

  constructor() {
    this.currentPageNumber = 1;
    this.resultsPerPage = Number(Utils.getPreference("resultsPerPage", Defaults.resultsPerPage));
    this.favorites = [];
  }

  /**
   * @param {Post[]} favorites
   */
  paginate(favorites) {
    this.favorites = favorites;
  }

  /**
   * @param {Number} pageNumber
   */
  changePage(pageNumber) {
    this.currentPageNumber = pageNumber;
  }

  /**
   * @returns {Post[]}
   */
  getFavoritesOnCurrentPage() {
    const {start, end} = this.getCurrentPageRange();
    return this.favorites.slice(start, end);
  }

  /**
   * @returns {{start: Number, end: Number}}
   */
  getCurrentPageRange() {
    return {
      start: this.resultsPerPage * (this.currentPageNumber - 1),
      end: this.resultsPerPage * this.currentPageNumber
    };
  }

  /**
   * @param {Number} resultsPerPage
   */
  updateResultsPerPage(resultsPerPage) {
    this.resultsPerPage = resultsPerPage;
  }

  /**
   * @param {NavigationKey} direction
   * @returns {Boolean}
   */
  gotoAdjacentPage(direction) {
    const isForwardNavigationKey = Types.isForwardNavigationKey(direction);

    if (this.onlyOnePage) {
      return false;
    }

    if (this.onFinalPage && isForwardNavigationKey) {
      this.changePage(1);
      return true;
    }

    if (this.onFirstPage && !isForwardNavigationKey) {
      this.changePage(this.pageCount);
      return true;
    }
    const newPageNumber = isForwardNavigationKey ? this.currentPageNumber + 1 : this.currentPageNumber - 1;

    this.changePage(newPageNumber);
    return true;
  }

  /**
   * @param {String} relation
   * @returns {Boolean}
   */
  gotoRelativePage(relation) {
    if (this.onlyOnePage) {
      return false;
    }

    switch (relation) {
      case "previous":
        if (this.onFirstPage) {
          return false;
        }
        this.gotoAdjacentPage("ArrowLeft");
        return true;

      case "first":
        if (this.onFirstPage) {
          return false;
        }
        this.changePage(1);
        return true;

      case "next":
        if (this.onFinalPage) {
          return false;
        }
        this.gotoAdjacentPage("ArrowRight");
        return true;

      case "final":
        if (this.onFinalPage) {
          return false;
        }
        this.changePage(this.pageCount);
        return true;

      default:
        return false;
    }
  }

  /**
   * @param {String} id
   * @returns {Boolean}
   */
  gotoPageWithFavorite(id) {
    const favoriteIds = this.favorites.map(favorite => favorite.id);
    const index = favoriteIds.indexOf(id);
    const favoriteNotFound = index === -1;

    if (favoriteNotFound) {
      return false;
    }
    const pageNumber = Math.floor(index / this.resultsPerPage) + 1;
    const favoriteOnDifferentPage = this.currentPageNumber !== pageNumber;

    if (favoriteOnDifferentPage) {
      this.changePage(pageNumber);
      return true;
    }
    return false;
  }
}
