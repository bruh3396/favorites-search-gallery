class FavoritesFetcher {
  /** @type {FetchedFavoritesQueue} */
  fetchedQueue;
  /** @type {Set<Number>} */
  pendingRequestPageNumbers;
  /** @type {FavoritesPageRequest[]} */
  failedRequests;
  /** @type {Set<String>} */
  storedFavoriteIds;
  /** @type {Number} */
  currentPageNumber;
  /** @type {Boolean} */
  fetchedAnEmptyPage;

  /** @type {Boolean} */
  get hasFailedRequests() {
    return this.failedRequests.length > 0;
  }

  /** @type {Boolean} */
  get allRequestsHaveStarted() {
    return this.fetchedAnEmptyPage;
  }

  /** @type {Boolean} */
  get someRequestsArePending() {
    return this.pendingRequestPageNumbers.size > 0 || this.hasFailedRequests;
  }

  /** @type {Boolean} */
  get allRequestsHaveCompleted() {
    return this.allRequestsHaveStarted && !this.someRequestsArePending;
  }

  /** @type {FavoritesPageRequest | null} */
  get oldestFailedFetchRequest() {
    return this.failedRequests.shift() || null;
  }

  /** @type {FavoritesPageRequest} */
  get newFetchRequest() {
    const request = new FavoritesPageRequest(this.currentPageNumber);

    this.pendingRequestPageNumbers.add(request.pageNumber);
    this.currentPageNumber += 1;
    return request;
  }

  /** @type {FavoritesPageRequest | null} */
  get nextFetchRequest() {
    if (this.hasFailedRequests) {
      return this.oldestFailedFetchRequest;
    }

    if (!this.allRequestsHaveStarted) {
      return this.newFetchRequest;
    }
    return null;
  }

  constructor() {
    this.fetchedQueue = new FetchedFavoritesQueue({
      onDequeue: () => { }
    });
    this.storedFavoriteIds = new Set();
    this.pendingRequestPageNumbers = new Set();
    this.failedRequests = [];
    this.currentPageNumber = 0;
    this.fetchedAnEmptyPage = false;
  }

  /**
   * @param {Function} onFavoritesFound
   * @returns {Promise<void>}
   */
  async fetchAllFavorites(onFavoritesFound) {
    this.fetchedQueue.onDequeue = (/** @type {FavoritesPageRequest} */ request) => {
      onFavoritesFound(request.favorites);
    };

    while (!this.allRequestsHaveCompleted) {
      await this.fetchFavoritesPage(this.nextFetchRequest);
    }
  }

  /**
   * @param {Set<String>} storedFavoriteIds
   * @returns {Promise<Post[]>}
   */
  async fetchNewFavoritesOnReload(storedFavoriteIds) {
    await Utils.sleep(100);
    this.storedFavoriteIds = storedFavoriteIds;
    /** @type {Post[]} */
    let favorites = [];

    while (true) {
      const {allNewFavoritesFound, newFavorites} = await this.fetchNewFavoritesOnReloadHelper();

      favorites = favorites.concat(newFavorites);

      if (allNewFavoritesFound) {
        this.storedFavoriteIds.clear();
        return favorites;
      }
    }
  }

  /**
   * @returns {Promise<{allNewFavoritesFound: Boolean, newFavorites: Post[]}>}
   */
  fetchNewFavoritesOnReloadHelper() {
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
    const fetchedFavorites = FavoritesExtractor.extractFavorites(html);
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
   * @param {FavoritesPageRequest | null} request
   */
  async fetchFavoritesPage(request) {
    if (request === null) {
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
        this.onFavoritesPageRequestError(request, error);
      });
    await Utils.sleep(request.fetchDelay);
  }

  /**
   * @param {Response} response
   * @returns {Promise<String>}
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
    request.favorites = FavoritesExtractor.extractFavorites(html);

    this.pendingRequestPageNumbers.delete(request.pageNumber);
    const favoritesPageIsEmpty = request.favorites.length === 0;

    this.fetchedAnEmptyPage = this.fetchedAnEmptyPage || favoritesPageIsEmpty;

    if (!favoritesPageIsEmpty) {
      this.fetchedQueue.enqueue(request);
    }
  }

  /**
   * @param {FavoritesPageRequest} request
   * @param {Error} error
   */
  onFavoritesPageRequestError(request, error) {
    console.error(error);
    request.incrementRetryCount();
    this.failedRequests.push(request);
  }
}
