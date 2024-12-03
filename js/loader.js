/* eslint-disable no-bitwise */
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
  fetchedThumbNodes;
  /**
   * @type {ThumbNode[]}
   */
  matchedThumbNodes;

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
    return (7 ** (this.retryCount + 1)) + 300;
  }

  /**
   * @param {Number} pageNumber
   */
  constructor(pageNumber) {
    this.pageNumber = pageNumber;
    this.retryCount = 0;
  }

  onFail() {
    this.retryCount += 1;
  }
}

class FavoritesLoader {
  static loadingStates = {
    initial: 0,
    retrievingDatabaseStatus: 1,
    fetchingFavorites: 2,
    loadingFavoritesFromDatabase: 3,
    allFavoritesLoaded: 4
  };
  static currentLoadingState = FavoritesLoader.loadingStates.initial;
  static databaseName = "Favorites";
  static objectStoreName = `user${getFavoritesPageId()}`;
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
      .then((connectionEvent) => {
        /**
         * @type {IDBDatabase}
         */
        const database = connectionEvent.target.result;
        const transaction = database.transaction(this.objectStoreName, "readwrite");
        const objectStore = transaction.objectStore(this.objectStoreName);

        transaction.oncomplete = () => {
          postMessage({
            response: "finishedStoring"
          });
          database.close();
        };

        transaction.onerror = (event) => {
          console.error(event);
        };

        favorites.forEach(favorite => {
          this.addContentTypeToFavorite(favorite);
          objectStore.put(favorite);
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
    let loadedFavorites = {};

    await this.openConnection()
      .then(async(connectionEvent) => {
        /**
         * @type {IDBDatabase}
         */
        const database = connectionEvent.target.result;
        const transaction = database.transaction(this.objectStoreName, "readwrite");
        const objectStore = transaction.objectStore(this.objectStoreName);
        const index = objectStore.index("id");

        transaction.onerror = (event) => {
          console.error(event);
        };
        transaction.oncomplete = () => {
          postMessage({
            response: "finishedLoading",
            favorites: loadedFavorites
          });
          database.close();
        };

        for (const id of idsToDelete) {
          const deleteRequest = index.getKey(id);

          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = resolve;
            deleteRequest.onerror = reject;
          }).then((indexEvent) => {
            const primaryKey = indexEvent.target.result;

            if (primaryKey !== undefined) {
              objectStore.delete(primaryKey);
            }
          }).catch((error) => {
            console.error(error);
          });
        }
        const getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = (event) => {
          loadedFavorites = event.target.result.reverse();
        };
        getAllRequest.onerror = (event) => {
          console.error(event);
        };
      });
  }

  /**
   * @param {[{id: String, tags: String, src: String, metadata: String}]} favorites
   */
  updateFavorites(favorites) {
    this.openConnection()
      .then((event) => {
        /**
         * @type {IDBDatabase}
         */
        const database = event.target.result;
        const favoritesObjectStore = database
          .transaction(this.objectStoreName, "readwrite")
          .objectStore(this.objectStoreName);
        const objectStoreIndex = favoritesObjectStore.index("id");
        let updatedCount = 0;

        favorites.forEach(favorite => {
          const index = objectStoreIndex.getKey(favorite.id);

          this.addContentTypeToFavorite(favorite);
          index.onsuccess = (indexEvent) => {
            const primaryKey = indexEvent.target.result;

            favoritesObjectStore.put(favorite, primaryKey);
            updatedCount += 1;

            if (updatedCount >= favorites.length) {
              database.close();
            }
          };
        });
      })
      .catch((event) => {
        const error = event.target.error;

        if (error.name === "VersionError") {
          this.version += 1;
          this.updateFavorites(favorites);
        } else {
          console.error(error);
        }
      });
  }

  /**
   * @param {{id: String, tags: String, src: String, metadata: String}} favorite
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
      favoritesDatabase.loadFavorites(request.idsToDelete);
      break;

    case "update":
      favoritesDatabase.updateFavorites(request.favorites);
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
  static parser = new DOMParser();

  static get disabled() {
    return !onFavoritesPage();
  }

  /**
   * @type {{highestInsertedPageNumber : Number, emptying: Boolean, insertionQueue: FavoritesPageRequest[]}}
   */
  fetchedThumbNodes;
  /**
   * @type {ThumbNode[]}
   */
  allThumbNodes;
  /**
   * @type {ThumbNode[]}
   */
  latestSearchResults;
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
  resultsPerPage;
  /**
   * @type {FavoritesPageRequest[]}
   */
  failedFetchRequests;
  /**
   * @type {Number}
   */
  expectedFavoritesCount;
  /**
   * @type {Boolean}
   */
  expectedFavoritesCountIsKnown;
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
   * @type {Boolean}
   */
  searchResultsWereShuffled;
  /**
  /**
   * @type {Boolean}
   */
  searchResultsWereInverted;
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
  recentlyChangedResultsPerPage;
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
  tagsWereModified;
  /**
   * @type {Boolean}
   */
  excludeBlacklistWasClicked;
  /**
   * @type {Boolean}
   */
  sortingParametersWereChanged;
  /**
   * @type {Boolean}
   */
  allowedRatingsWereChanged;
  /**
   * @type {Number}
   */
  allowedRatings;
  /**
   * @type {String[]}
   */
  idsRequiringMetadataDatabaseUpdate;
  /**
   * @type {Number}
   */
  newMetadataReceivedTimeout;

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
    if (FavoritesLoader.disabled) {
      return;
    }
    this.initializeFields();
    this.addEventListeners();
    this.initialize();
  }

  initializeFields() {
    this.allThumbNodes = [];
    this.latestSearchResults = [];
    this.searchResultsWhileFetching = [];
    this.idsRequiringMetadataDatabaseUpdate = [];
    this.finalPageNumber = this.getFinalFavoritesPageNumber();
    this.matchCountLabel = document.getElementById("match-count-label");
    this.resultsPerPage = getPreference("resultsPerPage", DEFAULTS.resultsPerPage);
    this.allowedRatings = loadAllowedRatings();
    this.fetchedThumbNodes = {};
    this.failedFetchRequests = [];
    this.expectedFavoritesCount = 53;
    this.expectedFavoritesCountIsKnown = false;
    this.searchResultsAreShuffled = false;
    this.searchResultsAreInverted = false;
    this.searchResultsWereShuffled = false;
    this.searchResultsWereInverted = false;
    this.foundEmptyFavoritesPage = false;
    this.newPageNeedsToBeCreated = false;
    this.tagsWereModified = false;
    this.recentlyChangedResultsPerPage = false;
    this.excludeBlacklistWasClicked = false;
    this.sortingParametersWereChanged = false;
    this.allowedRatingsWereChanged = false;
    this.matchingFavoritesCount = 0;
    this.maxPageNumberButtonCount = onMobileDevice() ? 3 : 5;
    this.searchQuery = "";
    this.databaseWorker = new Worker(getWorkerURL(FavoritesLoader.webWorkers.database));
    this.paginationContainer = this.createPaginationContainer();
    this.currentFavoritesPageNumber = 1;
  }

  addEventListeners() {
    window.addEventListener("modifiedTags", () => {
      this.tagsWereModified = true;
    });
    window.addEventListener("missingMetadata", (event) => {
      this.addNewFavoriteMetadata(event.detail);
    });
    window.addEventListener("reachedEndOfGallery", (event) => {
      this.changeResultsPageInGallery(event.detail);
    });
    this.createDatabaseMessageHandler();
  }

  createDatabaseMessageHandler() {
    this.databaseWorker.onmessage = (message) => {
      switch (message.data.response) {
        case "finishedLoading":
          this.paginateSearchResults(this.reconstructContent(message.data.favorites));
          this.onAllFavoritesLoaded();
          setTimeout(() => {
            this.findNewFavoritesOnReload(this.getAllFavoriteIds(), 0, []);
          }, 100);
          break;

        case "finishedStoring":
          break;

        default:
          break;
      }
    };
  }

  initialize() {
    this.setExpectedFavoritesCount();
    this.clearOriginalFavoritesPage();
    this.searchFavorites();
  }

  setExpectedFavoritesCount() {
    const profileURL = `https://rule34.xxx/index.php?page=account&s=profile&id=${getFavoritesPageId()}`;

    fetch(profileURL)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(response.status);
      })
      .then((html) => {
        const table = FavoritesLoader.parser.parseFromString(html, "text/html").querySelector("table");
        const favoritesURL = Array.from(table.querySelectorAll("a")).find(a => a.href.includes("page=favorites&s=view"));
        const favoritesCount = parseInt(favoritesURL.textContent);

        this.expectedFavoritesCountIsKnown = true;
        this.expectedFavoritesCount = favoritesCount;
      })
      .catch(() => {
        console.error(`Could not find total favorites count from ${profileURL}, are you logged in?`);
      });
  }

  clearOriginalFavoritesPage() {
    const thumbs = Array.from(document.getElementsByClassName("thumb"));

    getContent().innerHTML = "";
    setTimeout(() => {
      dispatchEvent(new CustomEvent("originalFavoritesCleared", {
        detail: thumbs
      }));
    }, 1000);
  }

  /**
   * @param {String} searchQuery
   */
  searchFavorites(searchQuery) {
    this.setSearchQuery(searchQuery);
    this.resetMatchCount();
    dispatchEvent(new Event("searchStarted"));
    this.showSearchResults();
  }

  /**
   * @param {String} searchQuery
   */
  setSearchQuery(searchQuery) {
    if (searchQuery !== undefined) {
      this.searchQuery = searchQuery;
    }
  }

  showSearchResults() {
    switch (FavoritesLoader.currentLoadingState) {
      case FavoritesLoader.loadingStates.initial:
        this.getAllFavorites();
        break;

      case FavoritesLoader.loadingStates.retrievingDatabaseStatus:
        break;

      case FavoritesLoader.loadingStates.fetchingFavorites:
        this.showSearchResultsWhileFetchingFavorites();
        break;

      case FavoritesLoader.loadingStates.loadingFavoritesFromDatabase:
        break;

      case FavoritesLoader.loadingStates.allFavoritesLoaded:
        this.showSearchResultsAfterAllFavoritesLoaded();
        break;

      default:
        console.error(`Invalid FavoritesLoader state: ${FavoritesLoader.currentLoadingState}`);
        break;
    }
  }

  showSearchResultsWhileFetchingFavorites() {
    this.searchResultsWhileFetching = this.getSearchResults(this.allThumbNodes);
    this.paginateSearchResults(this.searchResultsWhileFetching);
  }

  showSearchResultsAfterAllFavoritesLoaded() {
    this.paginateSearchResults(this.getSearchResults(this.allThumbNodes));
  }

  async getAllFavorites() {
    FavoritesLoader.currentLoadingState = FavoritesLoader.loadingStates.retrievingDatabaseStatus;
    const databaseStatus = await this.getDatabaseStatus();

    this.databaseWorker.postMessage({
      command: "create",
      objectStoreName: FavoritesLoader.objectStoreName,
      version: databaseStatus.version
    });

    if (databaseStatus.objectStoreIsNotEmpty) {
      this.loadFavoritesFromDatabase();
    } else {
      this.startFetchingAllFavorites();
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
   * @returns {ThumbNode[]}
   */
  getSearchResults(thumbNodes) {
    const searchCommand = new SearchCommand(this.finalSearchQuery);
    const results = [];

    for (const thumbNode of thumbNodes) {
      if (searchCommand.matches(thumbNode)) {
        results.push(thumbNode);
        thumbNode.setMatched(true);
      } else {
        thumbNode.setMatched(false);
      }
    }
    return results;
  }

  /**
   * @param {Object.<String, ThumbNode>} allFavoriteIds
   * @param {Number} currentPageNumber
   * @param {ThumbNode[]} newFavoritesToAdd
   */
  findNewFavoritesOnReload(allFavoriteIds, currentPageNumber, newFavoritesToAdd) {
    const favoritesURL = `${document.location.href}&pid=${currentPageNumber}`;
    const exceededFavoritesPageNumber = currentPageNumber > this.finalPageNumber;
    let allNewFavoritesFound = false;

    requestPageInformation(favoritesURL, (response) => {
      const thumbNodes = this.extractThumbNodesFromFavoritesPage(response);

      for (const thumbNode of thumbNodes) {
        const favoriteIsNotNew = allFavoriteIds[thumbNode.id] !== undefined;

        if (favoriteIsNotNew) {
          allNewFavoritesFound = true;
          break;
        }
        newFavoritesToAdd.push(thumbNode);
      }

      if (allNewFavoritesFound || exceededFavoritesPageNumber) {
        this.allThumbNodes = newFavoritesToAdd.concat(this.allThumbNodes);
        this.latestSearchResults = newFavoritesToAdd.concat(this.latestSearchResults);
        this.addNewFavoritesOnReload(newFavoritesToAdd);
      } else {
        this.findNewFavoritesOnReload(allFavoriteIds, currentPageNumber + 50, newFavoritesToAdd);
      }
    });
  }

  /**
   * @param {ThumbNode[]} newFavorites
   */
  addNewFavoritesOnReload(newFavorites) {
    if (newFavorites.length === 0) {
      dispatchEvent(new CustomEvent("newFavoritesFetchedOnReload", {
        detail: {
          empty: true,
          thumbs: []
        }
      }));
      return;
    }
    this.storeFavorites(newFavorites);
    this.insertNewFavorites(newFavorites);
    this.toggleLoadingUI(false);
  }

  initializeFetchedThumbNodesInsertionQueue() {
    this.fetchedThumbNodes.highestInsertedPageNumber = -1;
    this.fetchedThumbNodes.insertionQueue = [];
  }

  startFetchingAllFavorites() {
    FavoritesLoader.currentLoadingState = FavoritesLoader.loadingStates.fetchingFavorites;
    this.toggleContentVisibility(true);
    this.insertPaginationContainer();
    this.updatePaginationUi(1, []);
    this.initializeFetchedThumbNodesInsertionQueue();
    dispatchEvent(new Event("readyToSearch"));
    setTimeout(() => {
      dispatchEvent(new Event("startedFetchingFavorites"));
    }, 50);
    this.fetchAllFavorites();
  }

  updateProgressWhileFetching() {
    let progressText = `Fetching Favorites ${this.allThumbNodes.length}`;

    if (this.expectedFavoritesCountIsKnown) {
      progressText = `${progressText} / ${this.expectedFavoritesCount}`;
    }
    this.setProgressText(progressText);
  }

  async fetchAllFavorites() {
    let currentPageNumber = 0;

    while (FavoritesLoader.currentLoadingState === FavoritesLoader.loadingStates.fetchingFavorites) {
      if (this.failedFetchRequests.length > 0) {
        await this.refetchFailedFavoritesPage();
        continue;
      }

      if (currentPageNumber * 50 <= this.finalPageNumber && !this.foundEmptyFavoritesPage) {
        await this.fetchNewFavoritesPage(currentPageNumber);
        currentPageNumber += 1;
        continue;
      }

      if (this.isFinishedFetching(currentPageNumber)) {
        this.onAllFavoritesLoaded();
        this.storeFavorites();
        return;
      }
      await sleep(1000);
    }
  }

  async refetchFailedFavoritesPage() {
    const failedRequest = this.failedFetchRequests.shift();

    this.fetchFavorites(failedRequest);
    await sleep(failedRequest.retryDelay);
  }

  /**
   * @param {Number} pageNumber
   */
  async fetchNewFavoritesPage(pageNumber) {
    this.fetchFavorites(new FavoritesPageRequest(pageNumber));
    await sleep(210);
  }

  /**
   * @param {Number} pageNumber
   * @returns {Boolean}
   */
  isFinishedFetching(pageNumber) {
    pageNumber *= 50;
    let finishedFetching = this.allThumbNodes.length >= this.expectedFavoritesCount - 2;

    finishedFetching = finishedFetching || this.foundEmptyFavoritesPage || pageNumber >= (this.finalPageNumber * 2) + 1;
    return finishedFetching && this.failedFetchRequests.length === 0;
  }

  /**
   * @param {FavoritesPageRequest} request
   */
  fetchFavorites(request) {
    fetch(request.url)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(`${response.status}: Failed to fetch, ${request.url}`);
      })
      .then((html) => {
        request.fetchedThumbNodes = this.extractThumbNodesFromFavoritesPage(html);
        request.matchedThumbNodes = this.getSearchResults(request.fetchedThumbNodes);

        this.addFetchedThumbNodesToInsertionQueue(request);
        this.foundEmptyFavoritesPage = request.fetchedThumbNodes.length === 0;
      })
      .catch((error) => {
        console.error(error);
        request.onFail();
        this.failedFetchRequests.push(request);
      });
  }

  /**
   * @param {FavoritesPageRequest} request
   */
  addFetchedThumbNodesToInsertionQueue(request) {
    this.fetchedThumbNodes.insertionQueue.push(request);
    this.fetchedThumbNodes.insertionQueue.sort((request1, request2) => request1.pageNumber - request2.pageNumber);
    this.emptyInsertionQueue();
  }

  emptyInsertionQueue() {
    if (this.fetchedThumbNodes.emptying) {
      return;
    }
    this.fetchedThumbNodes.emptying = true;

    while (this.fetchedThumbNodes.insertionQueue.length > 0) {
      const request = this.fetchedThumbNodes.insertionQueue[0];

      if (this.previousPageNumberIsPresent(request.pageNumber)) {
        this.processFetchedThumbNodes(request);
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
   * @param {FavoritesPageRequest} request
   */
  processFetchedThumbNodes(request) {
    this.searchResultsWhileFetching = this.searchResultsWhileFetching.concat(request.matchedThumbNodes);
    const searchResultsWhileFetchingWithAllowedRatings = this.getResultsWithAllowedRatings(this.searchResultsWhileFetching);

    this.updateMatchCount(searchResultsWhileFetchingWithAllowedRatings.length);
    dispatchEvent(new CustomEvent("favoritesFetched", {
      detail: request.fetchedThumbNodes.map(thumbNode => thumbNode.root)
    }));
    this.allThumbNodes = this.allThumbNodes.concat(request.fetchedThumbNodes);
    this.addFavoritesToContent(request.matchedThumbNodes);
    this.updateProgressWhileFetching();
  }

  /**
   * @param {String} url
   * @param {Number} pageNumber
   * @returns {{url: String, pageNumber: Number, retries: Number}}
   */
  getFailedFetchRequest(url, pageNumber) {
    return {
      url,
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
    if (FavoritesLoader.currentLoadingState === FavoritesLoader.loadingStates.fetchingFavorites) {
      this.latestSearchResults = this.getResultsWithAllowedRatings(this.searchResultsWhileFetching);
      dispatchEvent(new CustomEvent("newSearchResults", {
        detail: this.latestSearchResults
      }));
    }
    dispatchEvent(new Event("readyToSearch"));
    FavoritesLoader.currentLoadingState = FavoritesLoader.loadingStates.allFavoritesLoaded;
    this.toggleLoadingUI(false);
    dispatchEvent(new Event("favoritesLoaded"));
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
    const searchCommand = new SearchCommand(this.finalSearchQuery);
    const searchResults = [];

    for (const record of databaseRecords) {
      const thumbNode = new ThumbNode(record, true);
      const isBlacklisted = !searchCommand.matches(thumbNode);

      if (isBlacklisted) {
        if (!userIsOnTheirOwnFavoritesPage()) {
          continue;
        }
        thumbNode.setMatched(false);
      } else {
        searchResults.push(thumbNode);
      }
      this.allThumbNodes.push(thumbNode);
    }
    return searchResults;
  }

  loadFavoritesFromDatabase() {
    FavoritesLoader.currentLoadingState = FavoritesLoader.loadingStates.loadingFavoritesFromDatabase;
    this.toggleLoadingUI(true);
    let idsToDelete = [];

    if (userIsOnTheirOwnFavoritesPage()) {
      idsToDelete = getIdsToDeleteOnReload();
      clearIdsToDeleteOnReload();
    }
    this.databaseWorker.postMessage({
      command: "load",
      idsToDelete
    });
  }

  /**
   * @param {ThumbNode[]} thumbNodes
   */
  async storeFavorites(thumbNodes) {
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

  /**
   * @param {ThumbNode[]} thumbNodes
   */
  updateFavorites(thumbNodes) {
    this.databaseWorker.postMessage({
      command: "update",
      favorites: thumbNodes.map(thumbNode => thumbNode.databaseRecord)
    });
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
   * @param {Number} value
   */
  updateMatchCount(value) {
    if (!this.matchCountLabelExists) {
      return;
    }
    this.matchingFavoritesCount = value === undefined ? this.getSearchResults(this.allThumbNodes).length : value;
    this.matchCountLabel.textContent = `${this.matchingFavoritesCount} Matches`;
  }

  /**
   * @param {Number} value
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
    getContent().style.display = value ? "" : "none";
  }

  /**
   * @param {ThumbNode[]} newThumbNodes
   */
  async insertNewFavorites(newThumbNodes) {
    const content = getContent();
    const searchCommand = new SearchCommand(this.finalSearchQuery);
    const insertedThumbNodes = [];
    const metadataPopulateWaitTime = 1000;

    newThumbNodes.reverse();

    if (this.allowedRatings !== 7) {
      await sleep(metadataPopulateWaitTime);
    }

    for (const thumbNode of newThumbNodes) {
      if (this.matchesSearchAndRating(searchCommand, thumbNode)) {
        thumbNode.insertAtBeginningOfContent(content);
        insertedThumbNodes.push(thumbNode);
      }
    }
    this.updatePaginationUi(this.currentFavoritesPageNumber, this.getThumbNodesMatchedByLastSearch());
    setTimeout(() => {
      dispatchEvent(new CustomEvent("newFavoritesFetchedOnReload", {
        detail: {
          empty: false,
          thumbs: insertedThumbNodes.map(thumbNode => thumbNode.root)
        }
      }));
    }, 250);
    dispatchEvent(new CustomEvent("newSearchResults", {
      detail: this.latestSearchResults
    }));
  }

  /**
   * @param {ThumbNode[]} thumbNodes
   */
  addFavoritesToContent(thumbNodes) {
    thumbNodes = this.getResultsWithAllowedRatings(thumbNodes);
    const searchResultsWhileFetchingWithAllowedRatings = this.getResultsWithAllowedRatings(this.searchResultsWhileFetching);
    const pageNumberButtons = document.getElementsByClassName("pagination-number");
    const lastPageButtonNumber = pageNumberButtons.length > 0 ? parseInt(pageNumberButtons[pageNumberButtons.length - 1].textContent) : 1;
    const pageCount = this.getPageCount(searchResultsWhileFetchingWithAllowedRatings.length);
    const needsToCreateNewPage = pageCount > lastPageButtonNumber;
    const nextPageButton = document.getElementById("next-page");
    const alreadyAtMaxPageNumberButtons = document.getElementsByClassName("pagination-number").length >= this.maxPageNumberButtonCount &&
      nextPageButton !== null && nextPageButton.style.display !== "none" &&
      nextPageButton.style.visibility !== "hidden";

    if (needsToCreateNewPage && !alreadyAtMaxPageNumberButtons) {
      this.updatePaginationUi(this.currentFavoritesPageNumber, searchResultsWhileFetchingWithAllowedRatings);
    } else {
      this.updatePageButtonEventListeners(searchResultsWhileFetchingWithAllowedRatings);
    }

    const onLastPage = (pageCount === this.currentFavoritesPageNumber);
    const missingThumbNodeCount = this.resultsPerPage - getAllThumbs().length;

    if (!onLastPage) {
      if (missingThumbNodeCount > 0) {
        thumbNodes = thumbNodes.slice(0, missingThumbNodeCount);
      } else {
        return;
      }
    }
    const content = getContent();

    for (const thumbNode of thumbNodes) {
      thumbNode.insertAtEndOfContent(content);
    }
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
    this.excludeBlacklistWasClicked = true;
  }

  /**
   * @param {Number} searchResultsLength
   * @returns {Number}
   */
  getPageCount(searchResultsLength) {
    if (searchResultsLength === 0) {
      return 1;
    }
    const pageCount = searchResultsLength / this.resultsPerPage;

    if (searchResultsLength % this.resultsPerPage === 0) {
      return pageCount;
    }
    return Math.floor(pageCount) + 1;
  }

  /**
   * @param {ThumbNode[]} searchResults
   */
  paginateSearchResults(searchResults) {
    searchResults = this.sortThumbNodes(searchResults);
    searchResults = this.getResultsWithAllowedRatings(searchResults);
    this.latestSearchResults = searchResults;
    this.updateMatchCount(searchResults.length);
    this.insertPaginationContainer();
    this.changeResultsPage(1, searchResults);
    dispatchEvent(new CustomEvent("newSearchResults", {
      detail: searchResults
    }));
  }

  insertPaginationContainer() {
    if (document.getElementById(this.paginationContainer.id) === null) {

      if (onMobileDevice()) {
        document.getElementById("favorites-top-bar-panels").insertAdjacentElement("afterbegin", this.paginationContainer);
      } else {
        const placeToInsertPagination = document.getElementById("favorites-pagination-placeholder");

        placeToInsertPagination.insertAdjacentElement("afterend", this.paginationContainer);
        placeToInsertPagination.remove();
      }
    }
  }

  /**
   * @returns {HTMLElement}
   */
  createPaginationContainer() {
    const container = document.createElement("span");

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

    previousPage.id = "previous-page";
    firstPage.id = "first-page";
    nextPage.id = "next-page";
    finalPage.id = "final-page";

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
      <input type="number" placeholder="page" style="width: 4em;" id="goto-page-input">
      <button id="goto-page-button">Go</button>
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

    this.paginationContainer.appendChild(container);
    this.updatePageButtonEventListeners(searchResults);
  }

  /**
   * @param {ThumbNode[]} searchResults
   */
  updatePageButtonEventListeners(searchResults) {
    const gotoPageButton = document.getElementById("goto-page-button");
    const finalPageButton = document.getElementById("final-page");
    const input = document.getElementById("goto-page-input");
    const pageCount = this.getPageCount(searchResults.length);

    if (gotoPageButton === null || finalPageButton === null || input === null) {
      return;
    }

    gotoPageButton.onclick = () => {
      let pageNumber = parseInt(input.value);

      if (!isNumber(pageNumber)) {
        return;
      }
      pageNumber = clamp(pageNumber, 1, pageCount);
      this.changeResultsPage(pageNumber, searchResults);

    };

    finalPageButton.onclick = () => {
      this.changeResultsPage(pageCount, searchResults);
    };
  }

  /**
   * @param {Number} pageNumber
   * @param {ThumbNode[]} searchResults
   */
  changeResultsPage(pageNumber, searchResults) {
    if (!this.aNewSearchWillProduceDifferentResults(pageNumber)) {
      return;
    }
    const {start, end} = this.getPaginationStartEndIndices(pageNumber);

    this.currentFavoritesPageNumber = pageNumber;
    this.updatePaginationUi(pageNumber, searchResults);
    this.createPaginatedFavoritesPage(searchResults, start, end);
    this.resetFlagsThatImplyDifferentSearchResults();

    if (FavoritesLoader.currentLoadingState !== FavoritesLoader.loadingStates.loadingFavoritesFromDatabase) {
      dispatchEvent(new Event("changedPage"));
    }
  }

  resetFlagsThatImplyDifferentSearchResults() {
    this.searchResultsWereShuffled = this.searchResultsAreShuffled;
    this.searchResultsWereInverted = this.searchResultsAreInverted;
    this.tagsWereModified = false;
    this.excludeBlacklistWasClicked = false;
    this.sortingParametersWereChanged = false;
    this.allowedRatingsWereChanged = false;
    this.searchResultsAreShuffled = false;
    this.searchResultsAreInverted = false;
    this.previousSearchQuery = this.searchQuery;
  }

  getPaginationStartEndIndices(pageNumber) {
    return {
      start: this.resultsPerPage * (pageNumber - 1),
      end: this.resultsPerPage * pageNumber
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

  /**
   * @param {ThumbNode[]} thumbNodes
   */
  reAddThumbNodeEventListeners(thumbNodes) {
    for (const thumbNode of thumbNodes) {
      thumbNode.setupAddOrRemoveButton();
    }
  }

  /**
   * @param {ThumbNode[]} searchResults
   * @param {Number} start
   * @param {Number} end
   * @returns
   */
  createPaginatedFavoritesPage(searchResults, start, end) {
    const content = getContent();
    const newContent = document.createDocumentFragment();

    for (const thumbNode of searchResults.slice(start, end)) {
      thumbNode.insertAtEndOfContent(newContent);
    }
    content.innerHTML = "";
    content.appendChild(newContent);
    window.scrollTo(0, 0);
  }

  /**
   * @param {Number} pageNumber
   * @returns {Boolean}
   */
  aNewSearchWillProduceDifferentResults(pageNumber) {
    return this.currentFavoritesPageNumber !== pageNumber ||
      this.searchQuery !== this.previousSearchQuery ||
      FavoritesLoader.currentLoadingState !== FavoritesLoader.loadingStates.allFavoritesLoaded ||
      this.searchResultsAreShuffled ||
      this.searchResultsAreInverted ||
      this.searchResultsWereShuffled ||
      this.searchResultsWereInverted ||
      this.recentlyChangedResultsPerPage ||
      this.tagsWereModified ||
      this.excludeBlacklistWasClicked ||
      this.sortingParametersWereChanged ||
      this.allowedRatingsWereChanged;
  }

  /**
   * @param {Number} start
   * @param {Number} end
   * @param {Number} searchResults
   * @returns
   */
  setPaginationLabel(start, end, searchResultsLength) {
    end = Math.min(end - 1, searchResultsLength);

    if (this.paginationLabel === undefined) {
      this.paginationLabel = document.getElementById("pagination-label");
    }

    if (searchResultsLength <= this.resultsPerPage) {
      this.paginationLabel.textContent = "";
      return;
    }
    this.paginationLabel.textContent = `${start + 1} - ${end + 1}`;
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
      previousPage.style.visibility = "hidden";
      firstPage.style.visibility = "hidden";
      nextPage.style.visibility = "hidden";
      finalPage.style.visibility = "hidden";
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
  updateResultsPerPage(value) {
    this.resultsPerPage = value;
    this.recentlyChangedResultsPerPage = true;
    this.searchFavorites();
    this.recentlyChangedResultsPerPage = false;

  }

  /**
   * @param {ThumbNode[]} thumbNodes
   * @returns {ThumbNode[]}
   */
  sortThumbNodes(thumbNodes) {
    if (!FavoritesLoader.loadingStates.allFavoritesLoaded) {
      alert("Wait for all favorites to load before changing sort method");
      return thumbNodes;
    }

    if (this.searchResultsAreShuffled) {
      return thumbNodes;
    }
    const sortedThumbNodes = thumbNodes.slice();
    const sortingMethod = getSortingMethod();

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
   * @returns {Boolean}
   */
  sortAscending() {
    const sortFavoritesAscending = document.getElementById("sort-ascending");
    return sortFavoritesAscending === null ? false : sortFavoritesAscending.checked;
  }

  onSortingParametersChanged() {
    this.sortingParametersWereChanged = true;
    const matchedThumbNodes = this.getThumbNodesMatchedByLastSearch();

    this.paginateSearchResults(matchedThumbNodes);
    dispatchEvent(new Event("sortingParametersChanged"));
  }

  /**
   * @param {Number} allowedRatings
   */
  onAllowedRatingsChanged(allowedRatings) {
    this.allowedRatings = allowedRatings;
    this.allowedRatingsWereChanged = true;
    const matchedThumbNodes = this.getThumbNodesMatchedByLastSearch();

    this.paginateSearchResults(matchedThumbNodes);
  }

  /**
   * @param {String} postId
   */
  addNewFavoriteMetadata(postId) {
    if (!ThumbNode.allThumbNodes.has(postId)) {
      return;
    }
    const batchSize = 500;
    const waitTime = 1000;

    clearTimeout(this.newMetadataReceivedTimeout);
    this.idsRequiringMetadataDatabaseUpdate.push(postId);

    if (this.idsRequiringMetadataDatabaseUpdate.length >= batchSize) {
      this.updateFavoriteMetadataInDatabase();
      return;
    }
    this.newMetadataReceivedTimeout = setTimeout(() => {
      this.updateFavoriteMetadataInDatabase();
    }, waitTime);
  }

  updateFavoriteMetadataInDatabase() {
    this.updateFavorites(this.idsRequiringMetadataDatabaseUpdate.map(id => ThumbNode.allThumbNodes.get(id)));
    this.idsRequiringMetadataDatabaseUpdate = [];
  }

  /**
   * @returns {Boolean}
   */
  allRatingsAreAllowed() {
    return this.allowedRatings === 7;
  }

  /**
   * @param {ThumbNode} thumbNode
   * @returns {Boolean}
   */
  ratingIsAllowed(thumbNode) {
    if (this.allRatingsAreAllowed()) {
      return true;
    }
    return (thumbNode.metadata.rating & this.allowedRatings) > 0;
  }

  /**
   * @param {ThumbNode[]} searchResults
   * @returns {ThumbNode[]}
   */
  getResultsWithAllowedRatings(searchResults) {
    if (this.allRatingsAreAllowed()) {
      return searchResults;
    }
    return searchResults.filter(thumbNode => this.ratingIsAllowed(thumbNode));
  }

  /**
   * @param {SearchCommand} searchCommand
   * @param {ThumbNode} thumbNode
   * @returns
   */
  matchesSearchAndRating(searchCommand, thumbNode) {
    return this.ratingIsAllowed(thumbNode) && searchCommand.matches(thumbNode);
  }

  /**
   * @param {Number} id
   */
  findFavorite(id) {
    const searchResults = this.latestSearchResults;
    const searchResultIds = searchResults.map(thumbNode => thumbNode.id);
    const index = searchResultIds.indexOf(id);

    if (index === -1) {
      return;
    }
    const pageNumber = Math.floor(index / this.resultsPerPage) + 1;

    dispatchEvent(new CustomEvent("foundFavorite", {
      detail: id
    }));
    this.changeResultsPage(pageNumber, searchResults);
    setTimeout(() => {
      scrollToThumb(id, true, false);
    }, 600);
  }

  /**
   *
   * @param {String} direction
   */
  changeResultsPageInGallery(direction) {
    const searchResults = this.latestSearchResults;
    const pageCount = this.getPageCount(searchResults.length);
    const onLastPage = this.currentFavoritesPageNumber === pageCount;
    const onFirstPage = this.currentFavoritesPageNumber === 1;
    const onlyOnePage = onFirstPage && onLastPage;

    if (onlyOnePage) {
      dispatchEvent(new CustomEvent("didNotChangePageInGallery", {
        detail: direction
      }));
      return;
    }

    if (onLastPage && direction === "ArrowRight") {
      this.changeResultsPage(1, searchResults);
      return;
    }

    if (onFirstPage && direction === "ArrowLeft") {
      this.changeResultsPage(pageCount, searchResults);
      return;
    }
    const newPageNumber = direction === "ArrowRight" ? this.currentFavoritesPageNumber + 1 : this.currentFavoritesPageNumber - 1;

    this.changeResultsPage(newPageNumber, searchResults);
  }
}

const favoritesLoader = new FavoritesLoader();
