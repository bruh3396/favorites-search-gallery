class FavoritesFetcher {
  /**
   * @type {Function}
   */
  onAllRequestsCompleted;
  /**
   * @type {Function}
   */
  onRequestCompleted;
  /**
   * @type {Set.<Number>}
   */
  pendingRequestPageNumbers;
  /**
   * @type {FavoritesPageRequest[]}
   */
  failedRequests;
  /**
   * @type {Set.<String>}
   */
  storedFavoriteIds;
  /**
   * @type {Number}
   */
  currentPageNumber;
  /**
   * @type {Boolean}
   */
  fetchedAnEmptyPage;

  /**
   * @type {Boolean}
   */
  get hasFailedRequests() {
    return this.failedRequests.length > 0;
  }

  /**
   * @type {Boolean}
   */
  get hasNotFetchedAll() {
    return !this.fetchedAnEmptyPage;
  }

  /**
   * @type {Boolean}
   */
  get allRequestsHaveStarted() {
    return this.fetchedAnEmptyPage;
  }

  /**
   * @type {Boolean}
   */
  get someRequestsAreStillPending() {
    return this.pendingRequestPageNumbers.size > 0;
  }

  /**
   * @type {Boolean}
   */
  get allRequestsHaveCompleted() {
    return this.allRequestsHaveStarted && !this.hasFailedRequests && !this.someRequestsAreStillPending;
  }

  /**
   * @type {FavoritesPageRequest}
   */
  get oldestFailedFetchRequest() {
    return this.failedRequests.shift();
  }

  /**
   * @type {FavoritesPageRequest}
   */
  get newFetchRequest() {
    const request = new FavoritesPageRequest(this.currentPageNumber);

    this.pendingRequestPageNumbers.add(request.pageNumber);
    this.currentPageNumber += 1;
    return request;
  }

  /**
   * @type {FavoritesPageRequest | null}
   */
  get nextFetchRequest() {
    if (this.hasFailedRequests) {
      return this.oldestFailedFetchRequest;
    }

    if (this.hasNotFetchedAll) {
      return this.newFetchRequest;
    }
    return null;
  }

  /**
   * @param {Function} onAllRequestsCompleted
   * @param {Function} onRequestCompleted
   */
  constructor(onAllRequestsCompleted, onRequestCompleted) {
    this.onAllRequestsCompleted = onAllRequestsCompleted;
    this.onRequestCompleted = onRequestCompleted;
    this.storedFavoriteIds = new Set();
    this.pendingRequestPageNumbers = new Set();
    this.failedRequests = [];
    this.currentPageNumber = 0;
    this.fetchedAnEmptyPage = false;
  }

  async fetchAllFavorites() {
    while (!this.allRequestsHaveCompleted) {
      await this.fetchFavoritesPage(this.nextFetchRequest);
    }
    this.onAllRequestsCompleted();
  }

  /**
   * @param {Set.<String>} storedFavoriteIds
   */
  async fetchAllNewFavoritesOnReload(storedFavoriteIds) {
    this.storedFavoriteIds = storedFavoriteIds;
    let favorites = [];

    while (true) {
      const {allNewFavoritesFound, newFavorites} = await this.fetchNewFavoritesOnReload();

      favorites = favorites.concat(newFavorites);

      if (allNewFavoritesFound) {
        this.storedFavoriteIds = null;
        this.onAllRequestsCompleted(favorites);
        return;
      }
    }
  }

  /**
   * @returns {Promise.<{allNewFavoritesFound: Boolean, newFavorites: Post[]}>}
   */
  fetchNewFavoritesOnReload() {
    return fetch(this.newFetchRequest.url)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        return this.extractNewFavorites(html);
      });
  }

  /**
   * @param {String} html
   * @returns {{allNewFavoritesFound: Boolean, newFavorites: Post[]}}
   */
  extractNewFavorites(html) {
    const newFavorites = [];
    const fetchedFavorites = FavoritesParser.extractFavorites(html);
    let allNewFavoritesFound = fetchedFavorites.length === 0;

    for (const favorite of fetchedFavorites) {
      if (this.storedFavoriteIds.has(favorite.id)) {
        allNewFavoritesFound = true;
        break;
      }
      newFavorites.push(favorite);
    }
    return {
      allNewFavoritesFound,
      newFavorites
    };
  }

  /**
   * @param {FavoritesPageRequest} request
   */
  async fetchFavoritesPage(request) {
    if (request === null) {
      // console.error("Error: null fetch request, possibly waiting for completions");
      await Utils.sleep(200);
      return;
    }
    fetch(request.url)
      .then((response) => {
        return this.onFavoritesPageRequestResponse(response);
      })
      .then((html) => {
        this.onFavoritesPageRequestSuccess(request, html);
      })
      .catch((error) => {
        this.onFavoritesPageRequestFail(request, error);
      });
    await Utils.sleep(request.retryDelay);
  }

  /**
   * @param {Response} response
   * @returns {Promise.<String>}
   */
  onFavoritesPageRequestResponse(response) {
    if (response.ok) {
      return response.text();
    }
    throw new Error(`${response.status}: Failed to fetch, ${response.url}`);
  }

  /**
   * @param {FavoritesPageRequest} request
   * @param {String} html
   */
  onFavoritesPageRequestSuccess(request, html) {
    request.fetchedFavorites = FavoritesParser.extractFavorites(html);
    this.pendingRequestPageNumbers.delete(request.pageNumber);
    const favoritesPageIsEmpty = request.fetchedFavorites.length === 0;

    this.fetchedAnEmptyPage = this.fetchedAnEmptyPage || favoritesPageIsEmpty;

    if (!favoritesPageIsEmpty) {
      this.onRequestCompleted(request);
    }
  }

  /**
   * @param {FavoritesPageRequest} request
   * @param {Error} error
   */
  onFavoritesPageRequestFail(request, error) {
    console.error(error);
    request.onFail();
    this.failedRequests.push(request);
  }
}
