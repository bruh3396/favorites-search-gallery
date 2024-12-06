class FavoritesPageFetcher {
  /**
   * @type {Function}
   */
  onAllFavoritesPageRequestsCompleted;
  /**
   * @type {Function}
   */
  onFavoritesPageRequestCompleted;
  /**
   * @type {FavoritesPageRequest[]}
   */
  failedFavoritesPageRequests;
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
  fetchedAnEmptyFavoritesPage;

  /**
   * @type {Boolean}
   */
  get hasFailedFavoritesPageRequests() {
    return this.failedFavoritesPageRequests.length > 0;
  }

  /**
   * @type {Boolean}
   */
  get allFavoritesPageRequestsAreCompleted() {
    return this.fetchedAnEmptyFavoritesPage && !this.hasFailedFavoritesPageRequests;
  }

  /**
   * @type {Boolean}
   */
  get hasNotFetchedAllFavoritesPages() {
    return !this.fetchedAnEmptyFavoritesPage;
  }

  /**
   * @type {FavoritesPageRequest}
   */
  get oldestFailedFavoritesPageFetchRequest() {
    return this.failedFavoritesPageRequests.shift();
  }

  /**
   * @type {FavoritesPageRequest}
   */
  get newFavoritesPageFetchRequest() {
    const request = new FavoritesPageRequest(this.currentPageNumber);

    this.currentPageNumber += 1;
    return request;
  }

  /**
   * @type {FavoritesPageRequest | null}
   */
  get currentFetchRequest() {
    if (this.hasFailedFavoritesPageRequests) {
      return this.oldestFailedFavoritesPageFetchRequest;
    }

    if (this.hasNotFetchedAllFavoritesPages) {
      return this.newFavoritesPageFetchRequest;
    }
    return null;
  }

  /**
   * @param {Function} onAllFavoritesPageRequestsCompleted
   * @param {Function} onFavoritesPageRequestCompleted
   */
  constructor(onAllFavoritesPageRequestsCompleted, onFavoritesPageRequestCompleted) {
    this.onAllFavoritesPageRequestsCompleted = onAllFavoritesPageRequestsCompleted;
    this.onFavoritesPageRequestCompleted = onFavoritesPageRequestCompleted;
    this.storedFavoriteIds = new Set();
    this.failedFavoritesPageRequests = [];
    this.currentPageNumber = 0;
    this.fetchedAnEmptyFavoritesPage = false;
  }

  async fetchAllFavorites() {
    while (true) {
      if (this.allFavoritesPageRequestsAreCompleted) {
        this.onAllFavoritesPageRequestsCompleted();
        return;
      }
      await this.fetchFavoritesPage(this.currentFetchRequest);
    }
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
        this.onAllFavoritesPageRequestsCompleted(favorites);
        return;
      }
    }
  }

  /**
   * @returns {Promise.<{allNewFavoritesFound: Boolean, newFavorites: Post[]}>}
   */
  fetchNewFavoritesOnReload() {
    return fetch(this.newFavoritesPageFetchRequest.url)
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
    const fetchedFavorites = FavoritesPageParser.extractFavorites(html);
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
      console.error("Error: null fetch request");
      return;
    }

    fetch(request.url)
      .then((response) => {
        return this.onRequestResponse(response);
      })
      .then((html) => {
        this.onRequestSuccess(request, html);
      })
      .catch((error) => {
        this.onRequestFail(request, error);
      });
    await sleep(request.retryDelay);
  }

  /**
   * @param {Response} response
   * @returns {Promise.<String>}
   */
  onRequestResponse(response) {
    if (response.ok) {
      return response.text();
    }
    throw new Error(`${response.status}: Failed to fetch, ${request.url}`);
  }

  /**
   * @param {FavoritesPageRequest} request
   * @param {String} html
   */
  onRequestSuccess(request, html) {
    request.fetchedFavorites = FavoritesPageParser.extractFavorites(html);
    this.fetchedAnEmptyFavoritesPage = this.fetchedAnEmptyFavoritesPage || request.fetchedFavorites.length === 0;
    this.onFavoritesPageRequestCompleted(request);
  }

  /**
   * @param {FavoritesPageRequest} request
   * @param {Error} error
   */
  onRequestFail(request, error) {
    console.error(error);
    request.onFail();
    this.failedFavoritesPageRequests.push(request);
  }
}
