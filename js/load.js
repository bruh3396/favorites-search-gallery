class FavoritesLoader {
  static loadState = {
    notStarted: 0,
    started: 1,
    finished: 2,
    indexedDB: 3
  };
  static objectStoreName = `user${getFavoritesPageId()}`;
  static databaseName = "Favorites";
  static webWorkers = {
    database:
`
/* eslint-disable prefer-template */
/**
 * @param {Number} milliseconds
 * @returns {Promise}
 */
function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

class FavoritesDatabase {
  /**
   * @type {String}
   */
  name = "Favorites";
  /**
   * @type {String}
   */
  objectStoreName;
  /**
   * @type {Number}
   */
  version;

  /**
   * @param {String} objectStoreName
   * @param {Number | String} version
   */
  constructor(objectStoreName, version) {
    this.objectStoreName = objectStoreName;
    this.version = version;
    this.createObjectStore();
  }

  createObjectStore() {
    this.openConnection((event) => {
      /**
       * @type {IDBDatabase}
       */
      const database = event.target.result;
      const objectStore = database
        .createObjectStore(this.objectStoreName, {
          autoIncrement: true
        });

      objectStore.createIndex("id", "id", {
        unique: true
      });
    }).then((event) => {
      event.target.result.close();
    });
  }

  /**
   * @param {Function} onUpgradeNeeded
   * @returns {Promise}
   */
  openConnection(onUpgradeNeeded) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.onsuccess = resolve;
      request.onerror = reject;
      request.onupgradeneeded = onUpgradeNeeded;
    });
  }

  /**
   * @param {[{id: String, tags: String, src: String, metadata: String}]} favorites
   */
  storeFavorites(favorites) {
    this.openConnection()
      .then((event) => {
        const database = event.target.result;
        const favoritesObjectStore = database
          .transaction(this.objectStoreName, "readwrite")
          .objectStore(this.objectStoreName);

        favorites.forEach(favorite => {
          this.addContentTypeToFavorite(favorite);
          favoritesObjectStore.put(favorite);
        });
        database.close();

        postMessage({
          response: "finishedStoring"
        });
      })
      .catch((event) => {
        const error = event.target.error;

        if (error.name === "VersionError") {
          this.version += 1;
          this.storeFavorites(favorites);
        } else {
          console.error(error);
        }
      });
  }

  /**
   * @param {String[]} idsToDelete
   */
  async loadFavorites(idsToDelete) {
    await this.openConnection()
      .then(async(event) => {
        const database = event.target.result;
        const objectStore = database
        .transaction(this.objectStoreName, "readwrite")
        .objectStore(this.objectStoreName);
      const index = objectStore.index("id");

      for (const id of idsToDelete) {
        const deleteRequest = index.getKey(id);

        await new Promise((resolve, reject) => {
          deleteRequest.onsuccess = resolve;
          deleteRequest.onerror = reject;
        }).then((event1) => {
          const primaryKey = event1.target.result;

          if (primaryKey !== undefined) {
            objectStore.delete(primaryKey);
          }
        });
      }
      objectStore.getAll().onsuccess = (successEvent) => {
        const results = successEvent.target.result.reverse();

        postMessage({
          response: "finishedLoading",
          favorites: results
        });
      };
      database.close();
      });

  }

  /**
   * @param {{id: String, tags: String, src: String}} favorite
   */
  addContentTypeToFavorite(favorite) {
    const tags = favorite.tags + " ";
    const isAnimated = tags.includes("animated ") || tags.includes("video ");
    const isGif = isAnimated && !tags.includes("video ");

    favorite.type = isGif ? "gif" : isAnimated ? "video" : "image";
  }
}

/**
 * @type {FavoritesDatabase}
 */
let favoritesDatabase;

onmessage = (message) => {
  const request = message.data;

  switch (request.command) {
    case "create":
      favoritesDatabase = new FavoritesDatabase(request.objectStoreName, request.version);
      break;

    case "store":
      favoritesDatabase.storeFavorites(request.favorites);
      break;

    case "load":
      favoritesDatabase.loadFavorites(request.deletedIds);
      break;

    default:
      break;
  }
};

`
  };
  static tagNegation = {
    useTagBlacklist: true,
    negatedTagBlacklist: negateTags(TAG_BLACKLIST)
  };
  /**
   * @type {Number}
   */
  static currentLoadState = FavoritesLoader.loadState.notStarted;
  static parser = new DOMParser();

  /**
   * @type {{highestInsertedPageNumber : Number, emptying: Boolean, insertionQueue: {pageNumber: Number, thumbNodes: ThumbNode[], searchResults: ThumbNode[]}[]}}
   */
  fetchedThumbNodes;
  /**
   * @type {ThumbNode[]}
   */
  allThumbNodes;
  /**
   * @type {Number}
   */
  finalPageNumber;
  /**
   * @type {HTMLLabelElement}
   */
  matchCountLabel;
  /**
   * @type {Number}
   */
  matchingFavoritesCount;
  /**
   * @type {Number}
   */
  maxNumberOfFavoritesToDisplay;
  /**
   * @type {[{url: String, pageNumber: Number, retries: Number}]}
   */
  failedFetchRequests;
  /**
   * @type {Number}
   */
  expectedFavoritesCount;
  /**
   * @type {Boolean}
   */
  expectedFavoritesCountFound;
  /**
   * @type {String}
   */
  searchQuery;
  /**
   * @type {String}
   */
  previousSearchQuery;
  /**
   * @type {Worker}
   */
  databaseWorker;
  /**
   * @type {Boolean}
   */
  searchResultsAreShuffled;
  /**
  /**
   * @type {Boolean}
   */
  searchResultsAreInverted;
  /**
   * @type {HTMLTextAreaElement}
   */
  favoritesSearchInput;
  /**
   * @type {Number}
   */
  currentFavoritesPageNumber;
  /**
   * @type {HTMLElement}
   */
  paginationContainer;
  /**
   * @type {HTMLLabelElement}
   */
  paginationLabel;
  /**
   * @type {Boolean}
   */
  foundEmptyFavoritesPage;
  /**
   * @type {ThumbNode[]}
   */
  searchResultsWhileFetching;
  /**
   * @type {Number}
   */
  recentlyChangedMaxNumberOfFavoritesToDisplay;
  /**
   * @type {Number}
   */
  maxPageNumberButtonCount;
  /**
   * @type {Boolean}
   */
  newPageNeedsToBeCreated;
  /**
   * @type {Boolean}
   */
  tagsWereRecentlyModified;
  /**
   * @type {Boolean}
   */
  excludeBlacklistClicked;
  /**
   * @type {Boolean}
  */
  sortParametersChanged;
  /**
   * @type {Boolean}
   */
  get databaseAccessIsAllowed() {
    return true;
  }

  /**
   * @type {String}
   */
  get finalSearchQuery() {
    if (FavoritesLoader.tagNegation.useTagBlacklist) {
      return `${this.searchQuery} ${FavoritesLoader.tagNegation.negatedTagBlacklist}`;
    }
    return this.searchQuery;
  }

  /**
   * @type {Boolean}
   */
  get matchCountLabelExists() {
    if (this.matchCountLabel === null) {
      this.matchCountLabel = document.getElementById("match-count-label");

      if (this.matchCountLabel === null) {
        return false;
      }
    }
    return true;
  }

  constructor() {
    if (onSearchPage()) {
      return;
    }
    this.allThumbNodes = [];
    this.searchResultsWhileFetching = [];
    this.finalPageNumber = this.getFinalFavoritesPageNumber();
    this.matchCountLabel = document.getElementById("match-count-label");
    this.maxNumberOfFavoritesToDisplay = getPreference("resultsPerPage", DEFAULTS.resultsPerPage);
    this.fetchedThumbNodes = {};
    this.failedFetchRequests = [];
    this.expectedFavoritesCount = 53;
    this.expectedFavoritesCountFound = false;
    this.searchResultsAreShuffled = false;
    this.searchResultsAreInverted = false;
    this.foundEmptyFavoritesPage = false;
    this.newPageNeedsToBeCreated = false;
    this.tagsWereRecentlyModified = false;
    this.recentlyChangedMaxNumberOfFavoritesToDisplay = false;
    this.excludeBlacklistClicked = false;
    this.sortParametersChanged = false;
    this.matchingFavoritesCount = 0;
    this.maxPageNumberButtonCount = onMobileDevice() ? 3 : 5;
    this.searchQuery = "";
    this.databaseWorker = new Worker(getWorkerURL(FavoritesLoader.webWorkers.database));
    this.favoritesSearchInput = document.getElementById("favorites-search-box");
    this.paginationContainer = this.createPaginationContainer();
    this.currentFavoritesPageNumber = 1;
    this.addEventListeners();
    this.createDatabaseMessageHandler();
    this.loadFavorites();
  }

  addEventListeners() {
    window.addEventListener("modifiedTags", () => {
      this.tagsWereRecentlyModified = true;
    });
  }

  createDatabaseMessageHandler() {
    this.databaseWorker.onmessage = (message) => {
      message = message.data;

      switch (message.response) {
        case "finishedLoading":
          FavoritesLoader.currentLoadState = FavoritesLoader.loadState.indexedDB;
          this.attachSavedFavoritesToDocument(message.favorites);
          this.updateSavedFavorites();
          break;

        case "finishedStoring":
          setTimeout(() => {
            this.databaseWorker.terminate();
          }, 5000);
          break;

        default:
          break;
      }
    };
  }

  loadFavorites() {
    this.clearOriginalContent();
    this.setFavoritesCount();
    this.searchFavorites();
  }

  setFavoritesCount() {
    const profilePage = `https://rule34.xxx/index.php?page=account&s=profile&id=${getFavoritesPageId()}`;

    fetch(profilePage)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(response.status);
      })
      .then((html) => {
        const table = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html").querySelector("table");

        if (table === null) {
          return;
        }

        for (const row of table.querySelectorAll("tr")) {
          const cells = row.querySelectorAll("td");

          if (cells.length >= 2 && cells[0].textContent.trim() === "Favorites") {
            this.expectedFavoritesCountFound = true;
            this.expectedFavoritesCount = parseInt(cells[1].textContent.trim());
            return;
          }
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  clearOriginalContent() {
    const thumbs = Array.from(document.getElementsByClassName("thumb"));

    setTimeout(() => {
      dispatchEvent(new CustomEvent("originalContentCleared", {
        detail: thumbs
      }));
    }, 1000);
    document.getElementById("content").innerHTML = "";
  }

  /**
   * @param {String} searchQuery
   */
  searchFavorites(searchQuery) {
    this.searchQuery = searchQuery === undefined ? this.searchQuery : searchQuery;
    this.hideAwesomplete();
    this.resetMatchCount();
    dispatchEvent(new Event("searchStarted"));
    setTimeout(() => {
      this.searchResultsAreShuffled = false;
      this.searchResultsAreInverted = false;
    }, 50);

    switch (FavoritesLoader.currentLoadState) {
      case FavoritesLoader.loadState.started:
        this.showSearchResultsAfterStartedLoading();
        break;

      case FavoritesLoader.loadState.finished:
        this.showSearchResultsAfterFinishedLoading();
        break;

      case FavoritesLoader.loadState.indexedDB:
        break;

      default:
        this.showSearchResultsBeforeStartedLoading();
    }
  }

  showSearchResultsAfterStartedLoading() {
    this.searchResultsWhileFetching = this.getSearchResults(this.allThumbNodes);
    this.paginateSearchResults(this.searchResultsWhileFetching);
  }

  showSearchResultsAfterFinishedLoading() {
    this.paginateSearchResults(this.getSearchResults(this.allThumbNodes));
  }

  async showSearchResultsBeforeStartedLoading() {
    if (!this.databaseAccessIsAllowed) {
      this.startFetchingFavorites();
      return;
    }
    const databaseStatus = await this.getDatabaseStatus();

    this.databaseWorker.postMessage({
      command: "create",
      objectStoreName: FavoritesLoader.objectStoreName,
      version: databaseStatus.version
    });

    if (databaseStatus.objectStoreIsNotEmpty) {
      this.loadFavoritesFromDatabase();
    } else {
      this.startFetchingFavorites();
    }
  }

  /**
   * @returns {{version: Number, objectStoreIsNotEmpty: Boolean}}
   */
  getDatabaseStatus() {
    return window.indexedDB.databases()
      .then((rule34Databases) => {
        const favoritesDatabases = rule34Databases.filter(database => database.name === FavoritesLoader.databaseName);

        if (favoritesDatabases.length !== 1) {
          return {
            version: 1,
            objectStoreIsNotEmpty: false
          };
        }
        const foundDatabase = favoritesDatabases[0];
        return new Promise((resolve, reject) => {
          const databaseRequest = indexedDB.open(FavoritesLoader.databaseName, foundDatabase.version);

          databaseRequest.onsuccess = resolve;
          databaseRequest.onerror = reject;
        }).then((event) => {
          const database = event.target.result;
          const objectStoreExists = database.objectStoreNames.contains(FavoritesLoader.objectStoreName);
          const version = database.version;

          if (!objectStoreExists) {
            database.close();
            return {
              version: database.version + 1,
              objectStoreIsNotEmpty: false
            };
          }
          const countRequest = database
            .transaction(FavoritesLoader.objectStoreName, "readonly")
            .objectStore(FavoritesLoader.objectStoreName).count();
          return new Promise((resolve, reject) => {
            countRequest.onsuccess = resolve;
            countRequest.onerror = reject;
          }).then((countEvent) => {
            database.close();
            return {
              version,
              objectStoreIsNotEmpty: countEvent.target.result > 0
            };
          });
        });
      });
  }

  /**
   * @param {ThumbNode[]} thumbNodes
   * @param {Number} stopIndex
   * @returns {ThumbNode[]}
   */
  getSearchResults(thumbNodes, stopIndex) {
    const searchCommand = getSearchCommand(this.finalSearchQuery);
    const results = [];

    stopIndex = stopIndex === undefined ? thumbNodes.length : stopIndex;
    stopIndex = Math.min(stopIndex, thumbNodes.length);

    for (let i = 0; i < stopIndex; i += 1) {
      const thumbNode = thumbNodes[i];

      if (postTagsMatchSearch(searchCommand, thumbNodes[i].postTags)) {
        results.push(thumbNodes[i]);
        thumbNode.toggleMatched(true);
      } else {
        thumbNode.toggleMatched(false);
      }
    }
    return results;
  }

  /**
   * @param {ThumbNode[]} thumbNodes
   * @param {Number} stopIndex
   * @returns {Object.<String, Number>}
   */
  getSearchResultIds(thumbNodes, stopIndex) {
    const results = {};

    for (const thumbNode of this.getSearchResults(thumbNodes, stopIndex)) {
      results[thumbNode.id] = 0;
    }
    return results;
  }

  fetchNewFavoritesWithoutReloadingPage() {
    const previousFavoriteCount = this.expectedFavoritesCount;
    let currentFavoritesCount = 0;

    this.setFavoritesCount();
    setTimeout(() => {
      currentFavoritesCount = getIdsToRemoveOnReload().length + this.expectedFavoritesCount;
      const newFavoritesCount = currentFavoritesCount - previousFavoriteCount;

      if (newFavoritesCount > 0) {
        this.updateSavedFavorites();
        this.setProgressText(`Fetching ${newFavoritesCount} new favorite${newFavoritesCount > 1 ? "s" : ""}`);
        this.showProgressText(true);
      }
    }, 800);
  }

  updateSavedFavorites() {
    setTimeout(() => {
      this.addNewFavoritesToSavedFavorites(this.getAllFavoriteIds(), 0, []);
    }, 100);
  }

  /**
   * @param {Object.<String, ThumbNode>} allFavoriteIds
   * @param {Number} currentPageNumber
   * @param {ThumbNode[]} newFavoritesToAdd
   */
  addNewFavoritesToSavedFavorites(allFavoriteIds, currentPageNumber, newFavoritesToAdd) {
    const favoritesPage = `${document.location.href}&pid=${currentPageNumber}`;
    let allNewFavoritesFound = false;
    const searchCommand = getSearchCommand(this.finalSearchQuery);

    requestPageInformation(favoritesPage, (response) => {
      const thumbNodes = this.extractThumbNodesFromFavoritesPage(response);

      for (const thumbNode of thumbNodes) {
        const favoriteIsNotNew = allFavoriteIds[thumbNode.id] !== undefined;

        if (favoriteIsNotNew) {
          allNewFavoritesFound = true;
          break;
        }

        if (postTagsMatchSearch(searchCommand, thumbNode.postTags)) {
          newFavoritesToAdd.push(thumbNode);
        }
      }

      if (!allNewFavoritesFound && currentPageNumber < this.finalPageNumber) {
        this.addNewFavoritesToSavedFavorites(allFavoriteIds, currentPageNumber + 50, newFavoritesToAdd);
      } else {
        this.allThumbNodes = newFavoritesToAdd.concat(this.allThumbNodes);
        this.finishUpdatingSavedFavorites(newFavoritesToAdd);
      }
    });
  }

  /**
   * @param {ThumbNode[]} newThumbNodes
   */
  finishUpdatingSavedFavorites(newThumbNodes) {
    if (newThumbNodes.length > 0) {
      this.insertNewFavoritesAfterReloadingPage(newThumbNodes);
      this.storeFavorites(newThumbNodes);
      this.toggleLoadingUI(false);
      this.updateMatchCount(this.allThumbNodes.filter(thumbNode => thumbNode.isVisible).length);
    } else {
      this.databaseWorker.terminate();
    }
  }

  initializeFetchedThumbNodesInsertionQueue() {
    this.fetchedThumbNodes.highestInsertedPageNumber = -1;
    this.fetchedThumbNodes.insertionQueue = [];
  }

  startFetchingFavorites() {
    FavoritesLoader.currentLoadState = FavoritesLoader.loadState.started;
    this.toggleContentVisibility(true);
    this.insertPaginationContainer();
    this.updatePaginationUi(1, []);
    this.initializeFetchedThumbNodesInsertionQueue();
    setTimeout(() => {
      dispatchEvent(new Event("startedFetchingFavorites"));
    }, 50);
    this.fetchFavorites();
  }

  updateProgressWhileFetching() {
    let progressText = `Saving Favorites ${this.allThumbNodes.length}`;

    if (this.expectedFavoritesCountFound) {
      progressText = `${progressText} / ${this.expectedFavoritesCount}`;
    }
    this.setProgressText(progressText);
  }

  async fetchFavorites() {
    let currentPageNumber = 0;

    while (FavoritesLoader.currentLoadState === FavoritesLoader.loadState.started) {
      if (this.failedFetchRequests.length > 0) {
        const failedRequest = this.failedFetchRequests.shift();
        const waitTime = (7 ** (failedRequest.retries + 1)) + 300;

        this.fetchFavoritesFromSinglePage(currentPageNumber, failedRequest);
        await sleep(waitTime);
      } else if (currentPageNumber <= this.finalPageNumber && !this.foundEmptyFavoritesPage) {
        this.fetchFavoritesFromSinglePage(currentPageNumber);
        currentPageNumber += 1;
        await sleep(200);
      } else if (this.finishedFetching(currentPageNumber)) {
        this.onAllFavoritesLoaded();
        this.storeFavorites();
      } else {
        await sleep(10000);
      }
    }
  }

  /**
   * @param {Number} pageNumber
   * @returns {Boolean}
   */
  finishedFetching(pageNumber) {
    pageNumber *= 50;
    let done = this.allThumbNodes.length >= this.expectedFavoritesCount - 2;

    done = done || this.foundEmptyFavoritesPage || pageNumber >= (this.finalPageNumber * 2) + 1;
    return done && this.failedFetchRequests.length === 0;
  }

  /**
   * @param {String} html
   * @returns {{thumbNodes: ThumbNode[], searchResults: ThumbNode[]}}
   */
  extractFavoritesPage(html) {
    const thumbNodes = this.extractThumbNodesFromFavoritesPage(html);
    const searchResults = this.getSearchResults(thumbNodes);
    return {
      thumbNodes,
      searchResults
    };
  }

  /**
   * @param {Number} pageNumber
   * @param {{url: String, pageNumber: Number, retries: Number}} failedRequest
   */
  fetchFavoritesFromSinglePage(pageNumber, failedRequest) {
    const refetching = failedRequest !== undefined;

    pageNumber = refetching ? failedRequest.pageNumber : pageNumber * 50;
    const favoritesPage = refetching ? failedRequest.url : `${document.location.href}&pid=${pageNumber}`;
    return fetch(favoritesPage)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }

        if (refetching) {
          failedRequest.retries += 1;
        } else {
          failedRequest = this.getFailedFetchRequest(response, pageNumber);
        }
        this.failedFetchRequests.push(failedRequest);
        throw new Error(response.status);
      })
      .then((html) => {
        const {thumbNodes, searchResults} = this.extractFavoritesPage(html);

        this.addFetchedThumbNodesToInsertionQueue(pageNumber, thumbNodes, searchResults);
        this.foundEmptyFavoritesPage = thumbNodes.length === 0;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * @param {Number} pageNumber
   * @param {ThumbNode[]} thumbNodes
   * @param {ThumbNode[]} searchResults
   */
  addFetchedThumbNodesToInsertionQueue(pageNumber, thumbNodes, searchResults) {
    pageNumber = Math.floor(parseInt(pageNumber) / 50);
    this.fetchedThumbNodes.insertionQueue.push({
      pageNumber,
      thumbNodes,
      searchResults
    });
    this.fetchedThumbNodes.insertionQueue.sort((a, b) => a.pageNumber - b.pageNumber);
    this.emptyInsertionQueue();
  }

  emptyInsertionQueue() {
    if (this.fetchedThumbNodes.emptying) {
      return;
    }
    this.fetchedThumbNodes.emptying = true;

    while (this.fetchedThumbNodes.insertionQueue.length > 0) {
      const element = this.fetchedThumbNodes.insertionQueue[0];

      if (this.previousPageNumberIsPresent(element.pageNumber)) {
        this.processFetchedThumbNodes(element.thumbNodes, element.searchResults);
        this.fetchedThumbNodes.insertionQueue.shift();
        this.fetchedThumbNodes.highestInsertedPageNumber += 1;
      } else {
        break;
      }
    }

    this.fetchedThumbNodes.emptying = false;
  }

  /**
   * @param {Number} pageNumber
   * @returns {Boolean}
   */
  previousPageNumberIsPresent(pageNumber) {
    return this.fetchedThumbNodes.highestInsertedPageNumber + 1 === pageNumber;
  }

  /**
   * @param {ThumbNode[]} thumbNodes
   * @param {ThumbNode[]} searchResults
   */
  processFetchedThumbNodes(thumbNodes, searchResults) {
    this.searchResultsWhileFetching = this.searchResultsWhileFetching.concat(searchResults);
    this.updateMatchCount(this.searchResultsWhileFetching.length);
    dispatchEvent(new CustomEvent("favoritesFetched", {
      detail: thumbNodes.map(thumbNode => thumbNode.root)
    }));
    this.allThumbNodes = this.allThumbNodes.concat(thumbNodes);
    this.addFavoritesToContent(searchResults);
    this.updateProgressWhileFetching();
  }

  /**
   * @param {String} response
   * @param {Number} pageNumber
   * @returns {{url: String, pageNumber: Number, retries: Number}}
   */
  getFailedFetchRequest(response, pageNumber) {
    return {
      url: response.url,
      pageNumber,
      retries: 0
    };
  }

  /**
   * @param {String} response
   * @returns {ThumbNode[]}
   */
  extractThumbNodesFromFavoritesPage(response) {
    const dom = FavoritesLoader.parser.parseFromString(response, "text/html");
    return Array.from(dom.getElementsByClassName("thumb")).map(thumb => new ThumbNode(thumb, false));
  }

  invertSearchResults() {
    this.resetMatchCount();
    this.allThumbNodes.forEach((thumbNode) => {
      thumbNode.toggleMatched();
    });
    const invertedSearchResults = this.getThumbNodesMatchedByLastSearch();

    this.searchResultsAreInverted = true;
    this.paginateSearchResults(invertedSearchResults);
    window.scrollTo(0, 0);
  }

  shuffleSearchResults() {
    const matchedThumbNodes = this.getThumbNodesMatchedByLastSearch();

    shuffleArray(matchedThumbNodes);
    this.searchResultsAreShuffled = true;
    this.paginateSearchResults(matchedThumbNodes);
  }

  getThumbNodesMatchedByLastSearch() {
    return this.allThumbNodes.filter(thumbNode => thumbNode.matchedByMostRecentSearch);
  }

  onAllFavoritesLoaded() {
    FavoritesLoader.currentLoadState = FavoritesLoader.loadState.finished;
    this.toggleLoadingUI(false);
    dispatchEvent(new CustomEvent("favoritesLoaded", {
      detail: this.allThumbNodes.map(thumbNode => thumbNode.root)
    }));
  }

  /**
   * @param {Boolean} value
   */
  toggleLoadingUI(value) {
    this.showLoadingWheel(value);
    this.toggleContentVisibility(!value);
    this.setProgressText(value ? "Loading Favorites" : "All Favorites Loaded");

    if (!value) {
      setTimeout(() => {
        this.showProgressText(false);
      }, 500);
    }
  }

  /**
   * @param {[{id: String, tags: String, src: String}]} databaseRecords
   * @returns {ThumbNode[]}}
   */
  reconstructContent(databaseRecords) {
    if (databaseRecords === null) {
      return null;
    }
    const searchCommand = getSearchCommand(this.finalSearchQuery);
    const searchResults = [];

    for (const record of databaseRecords) {
      const thumbNode = new ThumbNode(record, true);
      const isBlacklisted = !postTagsMatchSearch(searchCommand, thumbNode.postTags);

      if (isBlacklisted) {
        if (!userIsOnTheirOwnFavoritesPage()) {
          continue;
        }
        thumbNode.toggleMatched(false);
      } else {
        searchResults.push(thumbNode);
      }
      this.allThumbNodes.push(thumbNode);
    }
    return searchResults;
  }

  loadFavoritesFromDatabase() {
    this.toggleLoadingUI(true);
    let recentlyRemovedFavoriteIds = [];

    if (this.databaseAccessIsAllowed && userIsOnTheirOwnFavoritesPage()) {
      recentlyRemovedFavoriteIds = getIdsToRemoveOnReload();
      clearRecentlyRemovedIds();
    }
    this.databaseWorker.postMessage({
      command: "load",
      deletedIds: recentlyRemovedFavoriteIds
    });
  }

  /**
   * @param {ThumbNode[]} thumbNodes
   */
  async storeFavorites(thumbNodes) {
    if (!this.databaseAccessIsAllowed) {
      return;
    }
    const storeAll = thumbNodes === undefined;

    await sleep(500);
    thumbNodes = storeAll ? this.allThumbNodes : thumbNodes;
    const records = thumbNodes.map(thumbNode => thumbNode.databaseRecord);

    if (storeAll) {
      records.reverse();
    }
    this.databaseWorker.postMessage({
      command: "store",
      favorites: records
    });
  }

  hideAwesomplete() {
    if (this.favoritesSearchInput === null) {
      this.favoritesSearchInput = document.getElementById("favorites-search-box");
    }

    if (this.favoritesSearchInput === null) {
      return;
    }
    this.favoritesSearchInput.blur();
    setTimeout(() => {
      this.favoritesSearchInput.focus();
    }, 100);
  }

  /**
   * @returns {Number}
   */
  getFinalFavoritesPageNumber() {
    const lastPage = document.getElementsByName("lastpage")[0];

    if (lastPage === undefined) {
      return 0;
    }
    return parseInt(lastPage.getAttribute("onclick").match(/pid=([0-9]*)/)[1]);
  }

  deletePersistentData() {
    const message = `
Are you sure you want to reset?
This will delete all cached favorites, and preferences.
Tag modifications and saved searches will be preserved.
    `;

    if (confirm(message)) {
      const persistentLocalStorageKeys = new Set(["customTags", "savedSearches"]);

      Object.keys(localStorage).forEach((key) => {
        if (!persistentLocalStorageKeys.has(key)) {
          localStorage.removeItem(key);
        }
      });
      indexedDB.deleteDatabase(FavoritesLoader.databaseName);
    }
  }

  /**
   * @param {Boolean} value
   */
  showLoadingWheel(value) {
    document.getElementById("loading-wheel").style.display = value ? "flex" : "none";
  }

  /**
   * @param {Boolean} value
   */
  showProgressText(value) {
    document.getElementById("favorites-fetch-progress-label").style.display = value ? "inline-block" : "none";
  }

  /**
   * @param {String} text
   */
  setProgressText(text) {
    document.getElementById("favorites-fetch-progress-label").textContent = text;
  }

  resetMatchCount() {
    this.updateMatchCount(0);
  }

  /**
   * @param {Boolean} value
   */
  updateMatchCount(value) {
    if (!this.matchCountLabelExists) {
      return;
    }
    this.matchingFavoritesCount = value === undefined ? this.getSearchResults(this.allThumbNodes).length : value;
    this.matchCountLabel.textContent = `${this.matchingFavoritesCount} Matches`;
  }

  /**
   * @param {Boolean} value
   */
  incrementMatchCount(value) {
    if (!this.matchCountLabelExists) {
      return;
    }
    this.matchingFavoritesCount += value === undefined ? 1 : value;
    this.matchCountLabel.textContent = `${this.matchingFavoritesCount} Matches`;
  }

  /**
   * @param {Boolean} value
   */
  toggleContentVisibility(value) {
    document.getElementById("content").style.display = value ? "" : "none";
  }

  /**
   * @param {[{id: String, tags: String, src: String}]} databaseRecords
   */
  attachSavedFavoritesToDocument(databaseRecords) {
    this.paginateSearchResults(this.reconstructContent(databaseRecords));
    this.onAllFavoritesLoaded();
  }

  /**
   * @param {ThumbNode[]} newThumbNodes
   */
  insertNewFavoritesAfterReloadingPage(newThumbNodes) {
    const content = document.getElementById("content");
    const searchCommand = getSearchCommand(this.searchQuery);

    newThumbNodes.reverse();

    for (const thumbNode of newThumbNodes) {
      if (postTagsMatchSearch(searchCommand, thumbNode.postTags)) {
        thumbNode.insertInDocument(content, "afterbegin");
      }
    }
    this.updatePaginationUi(this.currentFavoritesPageNumber, this.getThumbNodesMatchedByLastSearch());
    setTimeout(() => {
      dispatchEvent(new CustomEvent("newFavoritesFetchedOnReload", {
        detail: newThumbNodes.map(thumbNode => thumbNode.root)
      }));
    }, 250);
  }

  /**
   * @param {ThumbNode[]} thumbNodes
   */
  addFavoritesToContent(thumbNodes) {
    const pageNumberButtons = document.getElementsByClassName("pagination-number");
    const lastPageButtonNumber = pageNumberButtons.length > 0 ? parseInt(pageNumberButtons[pageNumberButtons.length - 1].textContent) : 1;
    const pageCount = this.getPageCount(this.searchResultsWhileFetching.length);
    const needsToCreateNewPage = pageCount > lastPageButtonNumber;
    const nextPageButton = document.getElementById("next-page-button");
    const alreadyAtMaxPageNumberButtons = document.getElementsByClassName("pagination-number").length >= this.maxPageNumberButtonCount &&
      nextPageButton !== null && nextPageButton.style.display !== "none" &&
      nextPageButton.style.visibility !== "hidden";

    if (needsToCreateNewPage && !alreadyAtMaxPageNumberButtons) {
      this.updatePaginationUi(this.currentFavoritesPageNumber, this.searchResultsWhileFetching);
    }

    const onLastPage = (pageCount === this.currentFavoritesPageNumber);
    const missingThumbNodeCount = this.maxNumberOfFavoritesToDisplay - getAllThumbs().length;

    if (!onLastPage) {
      if (missingThumbNodeCount > 0) {
        thumbNodes = thumbNodes.slice(0, missingThumbNodeCount);
      } else {
        return;
      }
    }

    const content = document.getElementById("content");

    for (const thumbNode of thumbNodes) {
      content.appendChild(thumbNode.root);
    }
  }

  /**
   * @returns {Object.<String, ThumbNode>}
   */
  getVisibleFavoriteIds() {
    const ids = {};

    for (const thumbNode of this.allThumbNodes) {
      if (thumbNode.isVisible) {
        ids[thumbNode.id] = thumbNode;
      }
    }
    return ids;
  }

  /**
   * @returns {Object.<String, ThumbNode>}
   */
  getAllFavoriteIds() {
    const favoriteIds = {};

    for (const thumbNode of this.allThumbNodes) {
      favoriteIds[thumbNode.id] = thumbNode;
    }
    return favoriteIds;
  }

  /**
   * @param {Boolean} value
   */
  toggleTagBlacklistExclusion(value) {
    FavoritesLoader.tagNegation.useTagBlacklist = value;
    this.excludeBlacklistClicked = true;
  }

  /**
   * @param {Number} searchResultsLength
   * @returns {Number}
   */
  getPageCount(searchResultsLength) {
    return Math.floor(searchResultsLength / this.maxNumberOfFavoritesToDisplay) + 1;
  }

  /**
   * @param {ThumbNode[]} searchResults
   */
  paginateSearchResults(searchResults) {
    this.updateMatchCount(searchResults.length);
    this.insertPaginationContainer();
    this.changeResultsPage(1, searchResults);
  }

  insertPaginationContainer() {
    if (document.getElementById(this.paginationContainer.id) === null) {
      const topRowButtons = Array.from(document.getElementById("left-favorites-panel-top-row").querySelectorAll("button"));
      const placeToInsertPagination = topRowButtons[topRowButtons.length - 1];

      placeToInsertPagination.insertAdjacentElement("afterend", this.paginationContainer);
    }
  }

  /**
   * @returns {HTMLElement}
   */
  createPaginationContainer() {
    const container = document.createElement("span");

    if (usingDarkTheme()) {
      injectStyleHTML(`
        #favorites-pagination-container {
          >button {
            border: 1px solid white !important;
            color: white !important;
          }
        }
      `, "pagination-style");
    }
    container.id = "favorites-pagination-container";
    return container;
  }

  /**
   * @param {Number} currentPageNumber
   * @param {ThumbNode[]} searchResults
   */
  createPageNumberButtons(currentPageNumber, searchResults) {
    const pageCount = this.getPageCount(searchResults.length);
    let numberOfButtonsCreated = 0;

    for (let i = currentPageNumber; i <= pageCount && numberOfButtonsCreated < this.maxPageNumberButtonCount; i += 1) {
      numberOfButtonsCreated += 1;
      this.createPageNumberButton(currentPageNumber, i, searchResults);
    }

    if (numberOfButtonsCreated >= this.maxPageNumberButtonCount) {
      return;
    }

    for (let j = currentPageNumber - 1; j >= 1 && numberOfButtonsCreated < this.maxPageNumberButtonCount; j -= 1) {
      numberOfButtonsCreated += 1;
      this.createPageNumberButton(currentPageNumber, j, searchResults, "afterbegin");
    }
  }

  /**
   * @param {Number} currentPageNumber
   * @param {Number} pageNumber
   * @param {ThumbNode[]} searchResults
   * @param {String} position
   */
  createPageNumberButton(currentPageNumber, pageNumber, searchResults, position = "beforeend") {
    const pageNumberButton = document.createElement("button");
    const selected = currentPageNumber === pageNumber;

    pageNumberButton.id = `favorites-page-${pageNumber}`;
    pageNumberButton.title = `Goto page ${pageNumber}`;
    pageNumberButton.className = "pagination-number";
    pageNumberButton.classList.toggle("selected", selected);
    pageNumberButton.onclick = () => {
      this.changeResultsPage(pageNumber, searchResults);
    };
    this.paginationContainer.insertAdjacentElement(position, pageNumberButton);
    pageNumberButton.textContent = pageNumber;
  }

  /**
   * @param {ThumbNode[]} searchResults
   */
  createPageTraversalButtons(searchResults) {
    const pageCount = this.getPageCount(searchResults.length);
    const previousPage = document.createElement("button");
    const firstPage = document.createElement("button");
    const nextPage = document.createElement("button");
    const finalPage = document.createElement("button");

    previousPage.textContent = "<";
    firstPage.textContent = "<<";
    nextPage.textContent = ">";
    finalPage.textContent = ">>";
    previousPage.onclick = () => {
      if (this.currentFavoritesPageNumber - 1 >= 1) {
        this.changeResultsPage(this.currentFavoritesPageNumber - 1, searchResults);
      }
    };
    firstPage.onclick = () => {
      this.changeResultsPage(1, searchResults);
    };
    nextPage.onclick = () => {
      if (this.currentFavoritesPageNumber + 1 <= pageCount) {
        this.changeResultsPage(this.currentFavoritesPageNumber + 1, searchResults);
      }
    };
    finalPage.onclick = () => {
      this.changeResultsPage(pageCount, searchResults);
    };
    this.paginationContainer.insertAdjacentElement("afterbegin", previousPage);
    this.paginationContainer.insertAdjacentElement("afterbegin", firstPage);
    this.paginationContainer.appendChild(nextPage);
    this.paginationContainer.appendChild(finalPage);

    this.updateVisibilityOfPageTraversalButtons(previousPage, firstPage, nextPage, finalPage, this.getPageCount(searchResults.length));
  }

  /**
   * @param {ThumbNode[]} searchResults
   */
  createGotoSpecificPageInputs(searchResults) {
    if (this.firstPageNumberExists() && this.lastPageNumberExists(this.getPageCount(searchResults.length))) {
      return;
    }
    const html = `
      <input type="number" placeholder="page" style="width: 4em;">
      <button>Go</button>
    `;
    const container = document.createElement("span");

    container.innerHTML = html;
    const input = container.children[0];
    const button = container.children[1];

    input.onkeydown = (event) => {
      if (event.key === "Enter") {
        button.click();
      }
    };
    button.onclick = () => {
      const pageNumber = clamp(parseInt(input.value), 1, this.getPageCount(searchResults.length));

      this.changeResultsPage(pageNumber, searchResults);
    };
    this.paginationContainer.appendChild(container);
  }

  /**
   * @param {Number} pageNumber
   * @param {ThumbNode[]} searchResults
   */
  changeResultsPage(pageNumber, searchResults) {
    if (this.onSamePage(pageNumber)) {
      return;
    }
    const {start, end} = this.getPaginationStartEndIndices(pageNumber);

    this.tagsWereRecentlyModified = false;
    this.excludeBlacklistClicked = false;
    this.sortParametersChanged = false;
    this.previousSearchQuery = this.searchQuery;
    this.currentFavoritesPageNumber = pageNumber;
    this.updatePaginationUi(pageNumber, searchResults);
    this.createPaginatedFavoritesPage(searchResults, start, end);
    this.reAddAllThumbNodeEventListeners();

    if (FavoritesLoader.currentLoadState !== FavoritesLoader.loadState.indexedDB) {
      dispatchEventWithDelay("changedPage");
    }
  }

  getPaginationStartEndIndices(pageNumber) {
    return {
      start: this.maxNumberOfFavoritesToDisplay * (pageNumber - 1),
      end: this.maxNumberOfFavoritesToDisplay * pageNumber
    };
  }

  /**
   * @param {Number} pageNumber
   * @param {ThumbNode[]} searchResults
   */
  updatePaginationUi(pageNumber, searchResults) {
    const {start, end} = this.getPaginationStartEndIndices(pageNumber);
    const searchResultsLength = searchResults.length;

    this.setPaginationLabel(start, end, searchResultsLength);
    this.paginationContainer.innerHTML = "";
    this.createPageNumberButtons(pageNumber, searchResults);
    this.createPageTraversalButtons(searchResults);
    this.createGotoSpecificPageInputs(searchResults);
  }

  reAddAllThumbNodeEventListeners() {
    for (const thumbNode of this.allThumbNodes) {
      thumbNode.setupRemoveButton();
    }
  }

  /**
   * @param {ThumbNode[]} searchResults
   * @param {Number} start
   * @param {Number} end
   * @returns
   */
  createPaginatedFavoritesPage(searchResults, start, end) {
    const newThumbNodes = this.sortThumbNodes(searchResults).slice(start, end);
    const content = document.getElementById("content");
    const newContent = document.createDocumentFragment();

    for (const thumbNode of newThumbNodes) {
      newContent.appendChild(thumbNode.root);
    }
    content.innerHTML = "";
    content.appendChild(newContent);
    window.scrollTo(0, 0);
  }

  /**
   * @param {Number} pageNumber
   * @returns {Boolean}
   */
  onSamePage(pageNumber) {
    return (this.currentFavoritesPageNumber === pageNumber) &&
      (this.searchQuery === this.previousSearchQuery) &&
      !this.searchResultsAreShuffled &&
      !this.searchResultsAreInverted &&
      FavoritesLoader.currentLoadState === FavoritesLoader.loadState.finished &&
      !this.recentlyChangedMaxNumberOfFavoritesToDisplay &&
      !this.tagsWereRecentlyModified &&
      !this.excludeBlacklistClicked &&
      !this.sortParametersChanged;
  }

  /**
   * @param {Number} start
   * @param {Number} end
   * @param {Number} searchResults
   * @returns
   */
  setPaginationLabel(start, end, searchResultsLength) {
    end = Math.min(end, searchResultsLength);

    if (this.paginationLabel === undefined) {
      this.paginationLabel = document.getElementById("pagination-label");
    }

    if (searchResultsLength <= this.maxNumberOfFavoritesToDisplay) {
      this.paginationLabel.textContent = "";
      return;
    }

    this.paginationLabel.textContent = `${start} - ${end}`;
  }

  /**
   * @returns {Boolean}
   */
  firstPageNumberExists() {
    return document.getElementById("favorites-page-1") !== null;
  }

  /**
   * @param {Number} pageCount
   * @returns {Boolean}
   */
  lastPageNumberExists(pageCount) {
    return document.getElementById(`favorites-page-${pageCount}`) !== null;
  }

  /**
   * @param {HTMLButtonElement} previousPage
   * @param {HTMLButtonElement} firstPage
   * @param {HTMLButtonElement} nextPage
   * @param {HTMLButtonElement} finalPage
   * @param {Number} pageCount
   */
  updateVisibilityOfPageTraversalButtons(previousPage, firstPage, nextPage, finalPage, pageCount) {
    const firstNumberExists = this.firstPageNumberExists();
    const lastNumberExists = this.lastPageNumberExists(pageCount);

    if (firstNumberExists && lastNumberExists) {
      previousPage.style.display = "none";
      firstPage.style.display = "none";
      nextPage.style.display = "none";
      finalPage.style.display = "none";
    } else {
      if (firstNumberExists) {
        previousPage.style.visibility = "hidden";
        firstPage.style.visibility = "hidden";
      }

      if (lastNumberExists) {
        nextPage.style.visibility = "hidden";
        finalPage.style.visibility = "hidden";
      }
    }
  }
  /**
   * @param {Number} value
   */
  updateMaxNumberOfFavoritesToDisplay(value) {
    this.maxNumberOfFavoritesToDisplay = value;
    this.recentlyChangedMaxNumberOfFavoritesToDisplay = true;
    this.searchFavorites();
    this.recentlyChangedMaxNumberOfFavoritesToDisplay = false;
  }

  /**
   * @param {ThumbNode[]} thumbNodes
   * @returns {ThumbNode[]}
   */
  sortThumbNodes(thumbNodes) {
    if (!FavoritesLoader.loadState.finished) {
      alert("Wait for all favorites to load before changing sort method");
      return thumbNodes;
    }
    const sortedThumbNodes = thumbNodes.slice();
    const sortingMethod = this.getSortingMethod();

    if (sortingMethod !== "default") {
      sortedThumbNodes.sort((b, a) => {
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

    if (this.sortAscending()) {
      sortedThumbNodes.reverse();
    }
    return sortedThumbNodes;
  }

  /**
   * @returns {String}
   */
  getSortingMethod() {
    const sortingMethodSelect = document.getElementById("sorting-method");

    if (this.searchResultsAreShuffled) {
      return "default";
    }
    return sortingMethodSelect === null ? "default" : sortingMethodSelect.value;
  }

  /**
   * @returns {Boolean}
   */
  sortAscending() {
    const sortFavoritesAscending = document.getElementById("sort-ascending");
    return sortFavoritesAscending === null ? false : sortFavoritesAscending.checked;
  }

  onSortingParametersUpdated() {
    this.sortParametersChanged = true;
    this.searchFavorites();
  }
}

const favoritesLoader = new FavoritesLoader();
