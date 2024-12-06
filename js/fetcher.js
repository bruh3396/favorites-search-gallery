/* eslint-disable max-classes-per-file */
class FavoritesPageRequest {
  /**
   * @type {Number}
   */
  pageNumber;
  /**
   * @type {Number}
   */
  retryCount;
  /**
   * @type {ThumbNode[]}
   */
  fetchedFavorites;

  /**
   * @type {String}
   */
  get url() {
    return `${document.location.href}&pid=${this.pageNumber * 50}`;
  }

  /**
   * @type {Number}
   */
  get retryDelay() {
    return (7 ** (this.retryCount)) + 200;
  }

  /**
   * @param {Number} pageNumber
   */
  constructor(pageNumber) {
    this.pageNumber = pageNumber;
    this.retryCount = 0;
    this.fetchedFavorites = [];
  }

  onFail() {
    this.retryCount += 1;
  }
}

class FavoritesPageParser {
  static parser = new DOMParser();

  /**
   * @param {String} favoritesPageHTML
   * @returns {ThumbNode[]}
   */
  static extractFavorites(favoritesPageHTML) {
    const elements = FavoritesPageParser.extractThumbLikeElements(favoritesPageHTML);
    return elements.map(element => new ThumbNode(element, false));
  }

  /**
   * @param {String} favoritesPageHTML
   * @returns {HTMLElement[]}
   */
  static extractThumbLikeElements(favoritesPageHTML) {
    const dom = FavoritesPageParser.parser.parseFromString(favoritesPageHTML, "text/html");

    let elements = Array.from(dom.getElementsByClassName("thumb"));

    if (elements.length === 0) {
      elements = Array.from(dom.getElementsByTagName("img"))
        .filter(image => image.src.includes("thumbnail_"))
        .map(image => image.parentElement);
    }
    return elements;
  }
}

class FavoritesFetcher {
  /**
   * @type {FetchedFavoritesQueue}
   */
  fetchedFavoritesQueue;
  /**
   * @type {Function}
   */
  onAllFavoritesPageRequestsCompleted;
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
    this.fetchedFavoritesQueue = new FetchedFavoritesQueue(onFavoritesPageRequestCompleted);
    this.onAllFavoritesPageRequestsCompleted = onAllFavoritesPageRequestsCompleted;
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
   * @returns {Promise.<{allNewFavoritesFound: Boolean, newFavorites: ThumbNode[]}>}
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
   * @returns {{allNewFavoritesFound: Boolean, newFavorites: ThumbNode[]}}
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
    this.fetchedFavoritesQueue.onFavoritesPageRequestCompleted(request);
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

class FetchedFavoritesQueue {
  /**
   * @type {FavoritesPageRequest[]}
   */
  queue;
  /**
   * @type {Function}
   */
  onDequeue;
  /**
   * @type {Number}
   */
  highestDequeuedPageNumber;
  /**
   * @type {Boolean}
   */
  dequeuing;

  get allPreviousPagesWereDequeued() {
    return this.highestDequeuedPageNumber + 1 === this.queue[0].pageNumber;
  }

  get canDequeue() {
    return this.queue.length > 0 && this.allPreviousPagesWereDequeued;
  }

  constructor(onDequeue) {
    this.onDequeue = onDequeue;
    this.highestDequeuedPageNumber = -1;
    this.queue = [];
  }

  /**
   * @param {FavoritesPageRequest} request
   */
  onFavoritesPageRequestCompleted(request) {
    this.addFavoritesToQueue(request);
    this.sortQueueByPageNumber();
    this.emptyQueue();
  }

  /**
   * @param {FavoritesPageRequest} request
   */
  addFavoritesToQueue(request) {
    this.queue.push(request);
  }

  sortQueueByPageNumber() {
    this.queue.sort((request1, request2) => request1.pageNumber - request2.pageNumber);
  }

  emptyQueue() {
    if (this.dequeuing) {
      return;
    }
    this.dequeuing = true;

    while (this.canDequeue) {
      this.dequeue();
    }
    this.dequeuing = false;
  }

  dequeue() {
    this.highestDequeuedPageNumber += 1;
    this.onDequeue(this.queue.shift());
  }
}
