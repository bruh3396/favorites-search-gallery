class FavoritesLoader {
  static states = {
    initial: 0,
    retrievingDatabaseStatus: 1,
    fetchingFavorites: 2,
    loadingFavoritesFromDatabase: 3,
    allFavoritesLoaded: 4
  };
  static currentState = FavoritesLoader.states.initial;
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

  static get disabled() {
    return !onFavoritesPage();
  }

  /**
   * @type {Post[]}
   */
  allFavorites;
  /**
   * @type {Post[]}
   */
  latestSearchResults;
  /**
   * @type {HTMLLabelElement}
   */
  matchCountLabel;
  /**
   * @type {Number}
   */
  matchedFavoritesCount;
  /**
   * @type {Number | null}
   */
  expectedFavoritesCount;
  /**
   * @type {String}
   */
  searchQuery;
  /**
   * @type {Worker}
   */
  databaseWorker;
  /**
   * @type {Post[]}
   */
  searchResultsWhileFetching;
  /**
   * @type {Number}
   */
  allowedRatings;
  /**
   * @type {String[]}
   */
  favoriteIdsRequiringMetadataDatabaseUpdate;
  /**
   * @type {Number}
   */
  newMetadataReceivedTimeout;
  /**
   * @type {FavoritesFetcher}
   */
  fetcher;
  /**
   * @type {FetchedFavoritesQueue}
   */
  fetchedFavoritesQueue;
  /**
   * @type {FavoritesPaginator}
   */
  paginator;
  /**
   * @type {FavoritesSearchFlags}
   */
  searchFlags;

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

  /**
   * @type {Set.<String>}
   */
  get allFavoriteIds() {
    return new Set(Array.from(this.allFavorites.values()).map(post => post.id));
  }

  constructor() {
    if (FavoritesLoader.disabled) {
      return;
    }
    this.initializeFields();
    this.initializeComponents();
    this.addEventListeners();
    this.setExpectedFavoritesCount();
    this.clearOriginalFavoritesPage();
    this.searchFavorites();
  }

  initializeFields() {
    this.allFavorites = [];
    this.latestSearchResults = [];
    this.searchResultsWhileFetching = [];
    this.favoriteIdsRequiringMetadataDatabaseUpdate = [];
    this.matchCountLabel = document.getElementById("match-count-label");
    this.allowedRatings = loadAllowedRatings();
    this.expectedFavoritesCount = null;
    this.matchedFavoritesCount = 0;
    this.searchQuery = "";
    this.databaseWorker = new Worker(getWorkerURL(FavoritesLoader.webWorkers.database));
  }

  initializeComponents() {
    this.fetchedFavoritesQueue = new FetchedFavoritesQueue((request) => {
      this.processFetchedFavorites(request.fetchedFavorites);
    });
    this.fetcher = new FavoritesFetcher(() => {
      this.onAllFavoritesFetched();
    }, (request) => {
      this.fetchedFavoritesQueue.enqueue(request);
    });
    this.paginator = new FavoritesPaginator();
    this.searchFlags = new FavoritesSearchFlags();
  }

  addEventListeners() {
    window.addEventListener("modifiedTags", () => {
      this.searchFlags.tagsWereModified = true;
    });
    window.addEventListener("missingMetadata", (event) => {
      this.addNewMetadata(event.detail);
    });
    window.addEventListener("reachedEndOfGallery", (event) => {
      this.paginator.changePageWhileInGallery(event.detail, this.latestSearchResults);
    });
    this.createDatabaseMessageHandler();
  }

  createDatabaseMessageHandler() {
    this.databaseWorker.onmessage = (message) => {
      switch (message.data.response) {
        case "finishedLoading":
          this.paginateSearchResults(this.reconstructContent(message.data.favorites));
          this.onAllFavoritesLoadedFromDatabase();
          break;

        case "finishedStoring":
          this.setStatusText("All Favorites Saved");
          setTimeout(() => {
            this.toggleStatusText(false);
          }, 750);
          break;

        default:
          break;
      }
    };
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
        const table = new DOMParser().parseFromString(html, "text/html").querySelector("table");
        const favoritesURL = Array.from(table.querySelectorAll("a")).find(a => a.href.includes("page=favorites&s=view"));
        const favoritesCount = parseInt(favoritesURL.textContent);

        this.expectedFavoritesCount = favoritesCount;
      })
      .catch(() => {
        console.error(`Could not find total favorites count from ${profileURL}, are you logged in?`);
      });
  }

  clearOriginalFavoritesPage() {
    const thumbs = Array.from(document.getElementsByClassName("thumb"));
    let content = document.getElementById("content");

    if (content === null && thumbs.length > 0) {
      content = thumbs[0].closest("body>div");
    }

    if (content !== null) {
      content.remove();
    }
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
    dispatchEvent(new Event("searchStarted"));
    this.showSearchResults();
  }

  /**
   * @param {String} searchQuery
   */
  setSearchQuery(searchQuery) {
    if (searchQuery !== undefined) {
      this.searchQuery = searchQuery;
      this.searchFlags.searchQuery = searchQuery;
    }
  }

  showSearchResults() {
    switch (FavoritesLoader.currentState) {
      case FavoritesLoader.states.initial:
        this.loadAllFavorites();
        break;

      case FavoritesLoader.states.retrievingDatabaseStatus:
        break;

      case FavoritesLoader.states.fetchingFavorites:
        this.showSearchResultsWhileFetchingFavorites();
        break;

      case FavoritesLoader.states.loadingFavoritesFromDatabase:
        break;

      case FavoritesLoader.states.allFavoritesLoaded:
        this.showSearchResultsAfterAllFavoritesLoaded();
        break;

      default:
        console.error(`Invalid FavoritesLoader state: ${FavoritesLoader.currentState}`);
        break;
    }
  }

  showSearchResultsWhileFetchingFavorites() {
    this.searchResultsWhileFetching = this.getSearchResults(this.allFavorites);
    this.paginateSearchResults(this.searchResultsWhileFetching);
  }

  showSearchResultsAfterAllFavoritesLoaded() {
    this.paginateSearchResults(this.getSearchResults(this.allFavorites));
  }

  async loadAllFavorites() {
    FavoritesLoader.currentState = FavoritesLoader.states.retrievingDatabaseStatus;
    const databaseStatus = await this.getDatabaseStatus();

    this.databaseWorker.postMessage({
      command: "create",
      objectStoreName: FavoritesLoader.objectStoreName,
      version: databaseStatus.version
    });

    if (databaseStatus.objectStoreIsNotEmpty) {
      this.loadFavoritesFromDatabase();
    } else {
      this.fetchAllFavorites();
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
   * @param {Post[]} posts
   * @returns {Post[]}
   */
  getSearchResults(posts) {
    const searchCommand = new SearchCommand(this.finalSearchQuery);
    const results = [];

    for (const post of posts) {
      if (searchCommand.matches(post)) {
        results.push(post);
        post.setMatched(true);
      } else {
        post.setMatched(false);
      }
    }
    return results;
  }

  fetchNewFavoritesOnReload() {
    this.fetcher.onAllFavoritesPageRequestsCompleted = (newFavorites) => {
      this.addNewFavoritesOnReload(newFavorites);
    };
    this.fetcher.fetchAllNewFavoritesOnReload(this.allFavoriteIds);
  }

  /**
   * @param {Post[]} newFavorites
   */
  addNewFavoritesOnReload(newFavorites) {
    this.allFavorites = newFavorites.concat(this.allFavorites);
    this.latestSearchResults = newFavorites.concat(this.latestSearchResults);

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

  fetchAllFavorites() {
    FavoritesLoader.currentState = FavoritesLoader.states.fetchingFavorites;
    this.paginator.toggleContentVisibility(true);
    this.paginator.insertPaginationMenuContainer();
    this.paginator.createPaginationMenu(1, []);
    this.fetcher.fetchAllFavorites();
    dispatchEvent(new Event("readyToSearch"));
    setTimeout(() => {
      dispatchEvent(new Event("startedFetchingFavorites"));
    }, 50);
  }

  updateStatusWhileFetching() {
    let statusText = `Fetching Favorites ${this.allFavorites.length}`;

    if (this.expectedFavoritesCount !== null) {
      statusText = `${statusText} / ${this.expectedFavoritesCount}`;
    }
    this.setStatusText(statusText);
  }

  /**
   * @param {Post[]} favorites
   */
  processFetchedFavorites(favorites) {
    const matchedFavorites = this.getSearchResults(favorites);

    this.searchResultsWhileFetching = this.searchResultsWhileFetching.concat(matchedFavorites);
    const searchResultsWhileFetchingWithAllowedRatings = this.getResultsWithAllowedRatings(this.searchResultsWhileFetching);

    this.updateMatchCount(searchResultsWhileFetchingWithAllowedRatings.length);
    this.allFavorites = this.allFavorites.concat(favorites);
    this.addFetchedFavoritesToContent(searchResultsWhileFetchingWithAllowedRatings);
    this.updateStatusWhileFetching();
    dispatchEvent(new CustomEvent("favoritesFetched", {
      detail: favorites.map(post => post.root)
    }));
  }

  invertSearchResults() {
    this.resetMatchCount();
    this.allFavorites.forEach((post) => {
      post.toggleMatched();
    });
    const invertedSearchResults = this.getPostsMatchedByLastSearch();

    this.searchFlags.searchResultsAreInverted = true;
    this.paginateSearchResults(invertedSearchResults);
    window.scrollTo(0, 0);
  }

  shuffleSearchResults() {
    const matchedPosts = this.getPostsMatchedByLastSearch();

    shuffleArray(matchedPosts);
    this.searchFlags.searchResultsAreShuffled = true;
    this.paginateSearchResults(matchedPosts);
  }

  getPostsMatchedByLastSearch() {
    return this.allFavorites.filter(post => post.matchedByMostRecentSearch);
  }

  onAllFavoritesFetched() {
    this.latestSearchResults = this.getResultsWithAllowedRatings(this.searchResultsWhileFetching);
    dispatchEvent(new CustomEvent("newSearchResults", {
      detail: this.latestSearchResults
    }));
    this.onAllFavoritesLoaded();
    this.storeFavorites();
    this.setStatusText("Saving Favorites");
  }

  onAllFavoritesLoadedFromDatabase() {
    this.toggleLoadingUI(false);
    this.onAllFavoritesLoaded();
    setTimeout(() => {
      this.fetchNewFavoritesOnReload();
    }, 100);
  }

  onAllFavoritesLoaded() {
    dispatchEvent(new Event("readyToSearch"));
    dispatchEvent(new Event("favoritesLoaded"));
    FavoritesLoader.currentState = FavoritesLoader.states.allFavoritesLoaded;
  }

  /**
   * @param {Boolean} value
   */
  toggleLoadingUI(value) {
    this.showLoadingWheel(value);
    this.paginator.toggleContentVisibility(!value);
    this.setStatusText(value ? "Loading Favorites" : "All Favorites Loaded");

    if (!value) {
      setTimeout(() => {
        this.toggleStatusText(false);
      }, 500);
    }
  }

  /**
   * @param {[{id: String, tags: String, src: String}]} databaseRecords
   * @returns {Post[]}}
   */
  reconstructContent(databaseRecords) {
    if (databaseRecords === null) {
      return null;
    }
    const searchCommand = new SearchCommand(this.finalSearchQuery);
    const searchResults = [];

    for (const record of databaseRecords) {
      const post = new Post(record, true);
      const isBlacklisted = !searchCommand.matches(post);

      if (isBlacklisted) {
        if (!userIsOnTheirOwnFavoritesPage()) {
          continue;
        }
        post.setMatched(false);
      } else {
        searchResults.push(post);
      }
      this.allFavorites.push(post);
    }
    return searchResults;
  }

  loadFavoritesFromDatabase() {
    FavoritesLoader.currentState = FavoritesLoader.states.loadingFavoritesFromDatabase;
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
   * @param {Post[]} posts
   */
  async storeFavorites(posts) {
    const storeAll = posts === undefined;

    await sleep(500);
    posts = storeAll ? this.allFavorites : posts;
    const records = posts.map(post => post.databaseRecord);

    if (storeAll) {
      records.reverse();
    }
    this.databaseWorker.postMessage({
      command: "store",
      favorites: records
    });
  }

  /**
   * @param {Post[]} posts
   */
  updateFavorites(posts) {
    this.databaseWorker.postMessage({
      command: "update",
      favorites: posts.map(post => post.databaseRecord)
    });
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
  toggleStatusText(value) {
    document.getElementById("favorites-fetch-progress-label").style.display = value ? "inline-block" : "none";
  }

  /**
   * @param {String} text
   */
  setStatusText(text) {
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
    this.matchedFavoritesCount = value === undefined ? this.getSearchResults(this.allFavorites).length : value;
    const suffix = this.matchedFavoritesCount === 1 ? "Match" : "Matches";

    this.matchCountLabel.textContent = `${this.matchedFavoritesCount} ${suffix}`;
  }

  /**
   * @param {Number} value
   */
  incrementMatchCount(value) {
    if (!this.matchCountLabelExists) {
      return;
    }
    this.matchedFavoritesCount += value === undefined ? 1 : value;
    this.matchCountLabel.textContent = `${this.matchedFavoritesCount} Matches`;
  }

  /**
   * @param {Post[]} newPosts
   */
  async insertNewFavorites(newPosts) {
    const searchCommand = new SearchCommand(this.finalSearchQuery);
    const insertedPosts = [];
    const metadataPopulateWaitTime = 1000;

    newPosts.reverse();

    if (this.allowedRatings !== 7) {
      await sleep(metadataPopulateWaitTime);
    }

    for (const post of newPosts) {
      if (this.matchesSearchAndRating(searchCommand, post)) {
        this.paginator.insertNewFavorite(post);
        insertedPosts.push(post);
      }
    }
    this.paginator.createPaginationMenu(this.paginator.currentPageNumber, this.getPostsMatchedByLastSearch());
    setTimeout(() => {
      dispatchEvent(new CustomEvent("newFavoritesFetchedOnReload", {
        detail: {
          empty: false,
          thumbs: insertedPosts.map(post => post.root)
        }
      }));
    }, 250);
    dispatchEvent(new CustomEvent("newSearchResults", {
      detail: this.latestSearchResults
    }));
  }

  /**
   * @param {Post[]} favorites
   */
  addFetchedFavoritesToContent(favorites) {
    this.paginator.paginateWhileFetching(favorites);
  }

  /**
   * @param {Post[]} searchResults
   */
  paginateSearchResults(searchResults) {
    if (!this.searchFlags.aNewSearchCouldProduceDifferentResults) {
      return;
    }
    searchResults = this.sortPosts(searchResults);
    searchResults = this.getResultsWithAllowedRatings(searchResults);
    this.latestSearchResults = searchResults;
    this.updateMatchCount(searchResults.length);
    this.paginator.paginate(searchResults);
    this.searchFlags.resetFlagsImplyingDifferentSearchResults();
    dispatchEvent(new CustomEvent("newSearchResults", {
      detail: searchResults
    }));
  }

  /**
   * @param {Boolean} value
   */
  toggleTagBlacklistExclusion(value) {
    FavoritesLoader.tagNegation.useTagBlacklist = value;
    this.searchFlags.excludeBlacklistWasClicked = true;
  }

  /**
   * @param {Number} value
   */
  updateResultsPerPage(value) {
    this.paginator.maxFavoritesPerPage = value;
    this.searchFlags.recentlyChangedResultsPerPage = true;
    this.searchFavorites();
  }

  /**
   * @param {Post[]} posts
   * @returns {Post[]}
   */
  sortPosts(posts) {
    if (this.searchFlags.searchResultsAreShuffled) {
      return posts;
    }
    const sortedPosts = posts.slice();
    const sortingMethod = getSortingMethod();

    if (sortingMethod !== "default") {
      sortedPosts.sort((b, a) => {
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
      sortedPosts.reverse();
    }
    return sortedPosts;
  }

  /**
   * @returns {Boolean}
   */
  sortAscending() {
    const sortFavoritesAscending = document.getElementById("sort-ascending");
    return sortFavoritesAscending === null ? false : sortFavoritesAscending.checked;
  }

  onSortingParametersChanged() {
    this.searchFlags.sortingParametersWereChanged = true;
    const matchedPosts = this.getPostsMatchedByLastSearch();

    this.paginateSearchResults(matchedPosts);
    dispatchEvent(new Event("sortingParametersChanged"));
  }

  /**
   * @param {Number} allowedRatings
   */
  onAllowedRatingsChanged(allowedRatings) {
    this.allowedRatings = allowedRatings;
    this.searchFlags.allowedRatingsWereChanged = true;
    const matchedPosts = this.getPostsMatchedByLastSearch();

    this.paginateSearchResults(matchedPosts);
  }

  /**
   * @param {String} postId
   */
  addNewMetadata(postId) {
    if (!Post.allPosts.has(postId)) {
      return;
    }
    const batchSize = 500;
    const waitTime = 1000;

    clearTimeout(this.newMetadataReceivedTimeout);
    this.favoriteIdsRequiringMetadataDatabaseUpdate.push(postId);

    if (this.favoriteIdsRequiringMetadataDatabaseUpdate.length >= batchSize) {
      this.updateMetadataInDatabase();
      return;
    }
    this.newMetadataReceivedTimeout = setTimeout(() => {
      this.updateMetadataInDatabase();
    }, waitTime);
  }

  updateMetadataInDatabase() {
    this.updateFavorites(this.favoriteIdsRequiringMetadataDatabaseUpdate.map(id => Post.allPosts.get(id)));
    this.favoriteIdsRequiringMetadataDatabaseUpdate = [];
  }

  /**
   * @returns {Boolean}
   */
  allRatingsAreAllowed() {
    return this.allowedRatings === 7;
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  ratingIsAllowed(post) {
    if (this.allRatingsAreAllowed()) {
      return true;
    }
    // eslint-disable-next-line no-bitwise
    return (post.metadata.rating & this.allowedRatings) > 0;
  }

  /**
   * @param {Post[]} searchResults
   * @returns {Post[]}
   */
  getResultsWithAllowedRatings(searchResults) {
    if (this.allRatingsAreAllowed()) {
      return searchResults;
    }
    return searchResults.filter(post => this.ratingIsAllowed(post));
  }

  /**
   * @param {SearchCommand} searchCommand
   * @param {Post} post
   * @returns {Boolean}
   */
  matchesSearchAndRating(searchCommand, post) {
    return this.ratingIsAllowed(post) && searchCommand.matches(post);
  }

  /**
   * @param {String} id
   */
  findFavorite(id) {
    this.paginator.findFavorite(id);
  }
}

const favoritesLoader = new FavoritesLoader();
