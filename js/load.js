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
   * @param {[{id: String, tags: String, src: String}]} favorites
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
          favoritesObjectStore.add(favorite);
          database.close();
        });

        postMessage({
          response: "finishedStoring"
        });
      })
      .catch((event) => {
        const error = event.target.error;
        const errorType = error.name;

        if (errorType === "VersionError") {
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
   * @type {[{url: String, indexToInsert: Number}]}
   */
  failedFetchRequests;
  /**
   * @type {LoadState}
   */
  currentLoadState;
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
   * @type {Worker}
   */
  databaseWorker;
  /**
   * @type {Boolean}
   */
  searchResultsAreShuffled;
  /**
   * @type {HTMLTextAreaElement}
   */
  favoritesSearchInput;
  /**
   * @type {Number}
   */
  currentFavoritesPageNumber;

  /**
   * @type {Boolean}
   */
  get databaseAccessIsAllowed() {
    // return userIsOnTheirOwnFavoritesPage();
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
    if (onPostPage()) {
      return;
    }
    this.allThumbNodes = [];
    this.finalPageNumber = this.getFinalFavoritesPageNumber();
    this.matchCountLabel = document.getElementById("match-count-label");
    this.maxNumberOfFavoritesToDisplay = 100000;
    this.failedFetchRequests = [];
    this.currentLoadState = FavoritesLoader.loadState.notStarted;
    this.expectedFavoritesCount = 53;
    this.expectedFavoritesCountFound = false;
    this.matchingFavoritesCount = 0;
    this.searchQuery = "";
    this.databaseWorker = new Worker(getWorkerURL(FavoritesLoader.webWorkers.database));
    this.favoritesSearchInput = document.getElementById("favorites-search-box");
    this.currentFavoritesPageNumber = 0;
    this.createDatabaseMessageHandler();
    this.loadFavoritesPage();
  }

  createDatabaseMessageHandler() {
    this.databaseWorker.onmessage = (message) => {
      message = message.data;

      switch (message.response) {
        case "finishedLoading":
          this.currentLoadState = FavoritesLoader.loadState.indexedDB;
          this.attachSavedFavoritesToDocument(message.favorites);
          this.updateSavedFavorites();
          break;

          case "finishedStoring":
            setTimeout(() => {
              this.databaseWorker.terminate();
            }, 5000);

        default:
          break;
      }
    };
  }

  loadFavoritesPage() {
    this.clearContent();
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

  clearContent() {
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

    switch (this.currentLoadState) {
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
    const resultIds = this.getSearchResultIds(this.allThumbNodes, this.allThumbNodes.length - 1);

    for (const thumbNode of this.allThumbNodes) {
      if (resultIds[thumbNode.id] === undefined) {
        thumbNode.toggleVisibility(false);
      } else {
        thumbNode.toggleVisibility(true);
        this.incrementMatchCount();
      }
    }
  }

  showSearchResultsAfterFinishedLoading() {
    const resultIds = this.getSearchResultIds(this.allThumbNodes);
    let addedFavoritesCount = 0;

    this.unShuffleSearchResults();

    for (const thumbNode of this.allThumbNodes) {
      if (resultIds[thumbNode.id] === undefined || addedFavoritesCount >= this.maxNumberOfFavoritesToDisplay) {
        thumbNode.toggleVisibility(false);
      } else {
        thumbNode.toggleVisibility(true);
        this.incrementMatchCount();
        addedFavoritesCount += 1;
      }
    }
    dispatchEventWithDelay("finishedSearching");
  }

  async showSearchResultsBeforeStartedLoading() {
    if (!this.databaseAccessIsAllowed) {
      this.fetchFavorites();
      return;
    }
    const databaseStatus = await this.getDatabaseStatus();

    this.databaseWorker.postMessage({
      command: "create",
      objectStoreName: FavoritesLoader.objectStoreName,
      version: databaseStatus.version
    });
    const eventThatFavoritesBecomeVisibleAt = databaseStatus.objectStoreExists ? "favoritesLoaded" : "load";

    this.broadcastThumbUnderCursorOnLoadWhenAvailable(eventThatFavoritesBecomeVisibleAt);

    if (databaseStatus.objectStoreIsNotEmpty) {
      this.loadFavorites();
    } else {
      this.fetchFavorites();
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
      if (postTagsMatchSearch(searchCommand, thumbNodes[i].postTags)) {
        results.push(thumbNodes[i]);
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
   * @param {Object.<string, ThumbNode>} allFavoriteIds
   * @param {Number} currentPageNumber
   * @param {ThumbNode[]} newFavoritesToAdd
   */
  addNewFavoritesToSavedFavorites(allFavoriteIds, currentPageNumber, newFavoritesToAdd) {
    const favoritesPageURL = `${document.location.href}&pid=${currentPageNumber}`;
    let allNewFavoritesFound = false;

    requestPageInformation(favoritesPageURL, (response) => {
      const thumbNodes = this.extractThumbNodesFromFavoritesPage(response);

      for (const thumbNode of thumbNodes) {
        const favoriteIsNotNew = allFavoriteIds[thumbNode.id] !== undefined;

        if (favoriteIsNotNew) {
          allNewFavoritesFound = true;
          break;
        }
        newFavoritesToAdd.push(thumbNode);
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
    } else {
      this.databaseWorker.terminate();
    }
    this.updateMatchCount(getAllVisibleThumbs().length);
  }

  async fetchFavorites() {
    let currentPageNumber = 0;

    this.currentLoadState = FavoritesLoader.loadState.started;
    this.toggleContentVisibility(true);
    setTimeout(() => {
      dispatchEvent(new Event("startedFetchingFavorites"));
    }, 50);

    while (this.currentLoadState === FavoritesLoader.loadState.started) {
      await this.fetchFavoritesStep(currentPageNumber * 50);
      let progressText = `Saving Favorites ${this.allThumbNodes.length}`;

      if (this.expectedFavoritesCountFound) {
        progressText = `${progressText} / ${this.expectedFavoritesCount}`;
      }
      this.setProgressText(progressText);
      currentPageNumber += 1;
    }
  }

  /**
   * @param {Number} currentPageNumber
   */
  async fetchFavoritesStep(currentPageNumber) {
    let finishedLoading = this.allThumbNodes.length >= this.expectedFavoritesCount - 2;

    finishedLoading = finishedLoading || currentPageNumber >= (this.finalPageNumber * 2) + 1;
    finishedLoading = finishedLoading && this.failedFetchRequests.length === 0;

    if (currentPageNumber <= this.finalPageNumber) {
      await this.fetchFavoritesFromSinglePage(currentPageNumber);
    } else if (this.failedFetchRequests.length > 0) {
      const failedRequest = this.failedFetchRequests.shift();

      await this.fetchFavoritesFromSinglePage(currentPageNumber, failedRequest);
    } else if (finishedLoading) {
      this.onAllFavoritesLoaded();
      this.storeFavorites();
    }
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
   * @param {{url: String, indexToInsert: Number}} failedRequest
   */
  fetchFavoritesFromSinglePage(pageNumber, failedRequest) {
    const refetching = failedRequest !== undefined;
    const favoritesPageURL = refetching ? failedRequest.url : `${document.location.href}&pid=${pageNumber}`;
    return fetch(favoritesPageURL)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        failedRequest = refetching ? failedRequest : this.getFailedFetchRequest(response, pageNumber);
        this.failedFetchRequests.push(failedRequest);
        throw new Error(response.status);
      })
      .then((html) => {
        const {thumbNodes, searchResults} = this.extractFavoritesPage(html);

        setTimeout(() => {
          dispatchEvent(new CustomEvent("favoritesFetched", {
            detail: thumbNodes.map(thumbNode => thumbNode.root)
          }));
        }, 250);

        if (refetching) {
          this.allThumbNodes.splice(failedRequest.indexToInsert, 0, ...thumbNodes);
        } else {
          this.allThumbNodes = this.allThumbNodes.concat(thumbNodes);
        }

        if (this.allThumbNodes.length < this.maxNumberOfFavoritesToDisplay) {
          this.incrementMatchCount(searchResults.length);
          this.addFavoritesToContent(searchResults, failedRequest);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * @param {String} response
   * @param {Number} pageNumber
   * @returns {{url: String, indexToInsert: Number}}
   */
  getFailedFetchRequest(response, pageNumber) {
    return {
      url: response.url,
      indexToInsert: pageNumber - 1
    };
  }

  /**
   * @param {String} response
   * @returns {ThumbNode[]}
   */
  extractThumbNodesFromFavoritesPage(response) {
    const dom = new DOMParser().parseFromString(`<div>${response}</div>`, "text/html");
    return Array.from(dom.getElementsByClassName("thumb")).map(thumb => new ThumbNode(thumb, false));
  }

  invertSearchResults() {
    this.resetMatchCount();
    let addedFavoritesCount = 0;

    for (const thumbNode of this.allThumbNodes) {
      if (addedFavoritesCount < this.maxNumberOfFavoritesToDisplay && !thumbNode.isVisible) {
        thumbNode.toggleVisibility(true);
        this.incrementMatchCount();
        addedFavoritesCount += 1;
      } else {
        thumbNode.toggleVisibility(false);
      }
    }
    window.scrollTo(0, 0);
    dispatchEventWithDelay("finishedSearching");
  }

  shuffleSearchResults() {
    const thumbs = Array.from(getAllVisibleThumbs());
    const content = document.getElementById("content");

    shuffleArray(thumbs);

    for (const thumb of thumbs) {
      content.insertBefore(thumb, content.firstChild);
    }
    this.searchResultsAreShuffled = true;
    dispatchEventWithDelay("shuffle");
  }

  unShuffleSearchResults() {
    if (!this.searchResultsAreShuffled) {
      return;
    }
    const content = document.getElementById("content");

    for (const thumbNode of this.allThumbNodes) {
      content.appendChild(thumbNode.root);
    }
    this.searchResultsAreShuffled = false;
  }

  onAllFavoritesLoaded() {
    this.currentLoadState = FavoritesLoader.loadState.finished;
    this.toggleLoadingUI(false);
    dispatchEventWithDelay("favoritesLoaded");
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
   * @returns {{ content: HTMLElement | null, searchResults: ThumbNode[]}}
   */
  reconstructContent(databaseRecords) {
    if (databaseRecords === null) {
      return null;
    }
    const dom = new DOMParser().parseFromString("<div id=\"content\"></div>", "text/html");
    const content = dom.getElementById("content");
    const searchCommand = getSearchCommand(this.finalSearchQuery);
    const searchResults = [];

    let addedFavoritesCount = 0;

    for (const record of databaseRecords) {
      const thumbNode = new ThumbNode(record, true);
      const underMaximumFavorites = addedFavoritesCount < this.maxNumberOfFavoritesToDisplay;
      const isBlacklisted = !postTagsMatchSearch(searchCommand, thumbNode.postTags);

      if (isBlacklisted) {
        if (userIsOnTheirOwnFavoritesPage()) {
          thumbNode.toggleVisibility(false);
        } else {
          continue;
        }
      } else {
        searchResults.push(thumbNode);
      }
      this.allThumbNodes.push(thumbNode);

      if (underMaximumFavorites) {

        addedFavoritesCount += 1;
        content.appendChild(thumbNode.root);
      }
    }
    return {
      content,
      searchResults
    };
  }

  loadFavorites() {
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
  storeFavorites(thumbNodes) {
    if (!this.databaseAccessIsAllowed) {
      return;
    }
    const storeAll = thumbNodes === undefined;

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
This will delete all cached favorites, preferences, and custom searches.
    `;

    if (confirm(message)) {
      localStorage.clear();
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
    const {content, searchResults} = this.reconstructContent(databaseRecords);

    document.getElementById("content").remove();
    document.body.appendChild(content);
    this.paginateSearchResults(searchResults, false);
    this.updateMatchCount(getAllVisibleThumbs().length);
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
      thumbNode.insertInDocument(content, "afterbegin");

      if (!postTagsMatchSearch(searchCommand, thumbNode.postTags)) {
        thumbNode.toggleVisibility(false);
      }
    }
    setTimeout(() => {
      dispatchEvent(new CustomEvent("newFavoritesFetchedOnReload", {
        detail: newThumbNodes.map(thumbNode => thumbNode.root)
      }));
    }, 250);
  }

  /**
   * @param {ThumbNode[]} thumbNodes
   * @param {{url: String, indexToInsert: Number}} failedRequest
   */
  addFavoritesToContent(thumbNodes, failedRequest) {
    const content = document.getElementById("content");
    let elementToInsertAround = content;
    let placeToInsert = "beforeend";

    if (failedRequest !== undefined) {
      elementToInsertAround = getAllThumbs()[failedRequest.indexToInsert];
      placeToInsert = "afterend";
      thumbNodes = Array.from(thumbNodes).reverse();
    }

    for (const thumbNode of thumbNodes) {
      thumbNode.insertInDocument(elementToInsertAround, placeToInsert);
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
   * @param {String} eventName
   */
  broadcastThumbUnderCursorOnLoadWhenAvailable(eventName) {
    window.addEventListener(eventName, () => {
      setTimeout(() => {
        getThumbUnderCursorOnLoad();
      }, 500);
    }, {
      once: true
    });
  }

  /**
   * @param {Boolean} value
   */
  toggleTagBlacklistExclusion(value) {
    FavoritesLoader.tagNegation.useTagBlacklist = value;
  }

  /**
   * @param {ThumbNode[]} searchResults
   */
  paginateSearchResults(searchResults, clearAllContent = true) {
    const favoritesPagination = document.getElementById("favorites-pagination-container");
    const content = document.getElementById("content");

    if (favoritesPagination !== null) {
      favoritesPagination.remove();
    }

    if (searchResults.length < this.maxNumberOfFavoritesToDisplay) {
      return;
    }
    const pageCount = Math.floor(searchResults.length / this.maxNumberOfFavoritesToDisplay) + 1;
    const favoritesPerPage = this.maxNumberOfFavoritesToDisplay;
    const placeToInsertPagination = document.getElementById("left-favorites-panel-top-row");
    const container = document.createElement("span");

    if (clearAllContent) {
      content.innerHTML = "";
    }
    container.id = "favorites-pagination-container";
    placeToInsertPagination.appendChild(container);
    this.currentFavoritesPageNumber = 1;

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const isMiddlePage = pageNumber > 2 && pageNumber < pageCount;

      if (isMiddlePage) {
        continue;
      }
      const pageNavigationButton = document.createElement("button");

      pageNavigationButton.id = `favorites-page-${pageNumber}`;
      pageNavigationButton.onclick = () => {
        this.changeResultsPage(pageNumber, favoritesPerPage, searchResults, container);
      };
      container.appendChild(pageNavigationButton);
      pageNavigationButton.textContent = pageNumber;
    }
    this.createPageTraversalButtons(favoritesPerPage, searchResults, pageCount, container);
  }

  /**
   * @param {Number} favoritesPerPage
   * @param {ThumbNode[]} searchResults
   * @param {Number} pageCount
   * @param {HTMLElement} container
   */
  createPageTraversalButtons(favoritesPerPage, searchResults, pageCount, container) {
    const previousPage = document.createElement("button");
    const firstPage = document.createElement("button");
    const nextPage = document.createElement("button");
    const finalPage = document.createElement("button");

    previousPage.style.display = "none";
    firstPage.style.display = "none";
    previousPage.textContent = "<";
    firstPage.textContent = "<<";
    nextPage.textContent = ">";
    finalPage.textContent = ">>";
    previousPage.onclick = () => {
      this.changeResultsPage(this.currentFavoritesPageNumber - 1, favoritesPerPage, searchResults, container);
    };
    firstPage.onclick = () => {
      this.changeResultsPage(1, favoritesPerPage, searchResults, container);
    };
    nextPage.onclick = () => {
      this.changeResultsPage(this.currentFavoritesPageNumber + 1, favoritesPerPage, searchResults, container);
    };
    finalPage.onclick = () => {
      this.changeResultsPage(pageCount, favoritesPerPage, searchResults, container);
    };
    container.insertAdjacentElement("afterbegin", previousPage);
    container.insertAdjacentElement("afterbegin", firstPage);
    container.appendChild(nextPage);
    container.appendChild(finalPage);

  }

  /**
   * @param {Number} pageNumber
   * @param {Number} favoritesPerPage
   * @param {ThumbNode[]} searchResults
   * @param {HTMLElement} container
   */
  changeResultsPage(pageNumber, favoritesPerPage, searchResults, container) {
    const start = favoritesPerPage * (pageNumber - 1);
    const end = favoritesPerPage * pageNumber;
    const newThumbNodes = searchResults.slice(start, end);

    this.updateVisibilityOfPageTraversalButtons(end, searchResults, pageNumber, container);
    this.currentFavoritesPageNumber = pageNumber;
    content.innerHTML = "";

    for (const thumbNode of newThumbNodes) {
      content.appendChild(thumbNode.root);
    }
    window.scrollTo(0, 0);
    dispatchEventWithDelay("favoritesLoaded");
  }

  /**
   * @param {Number} end
   * @param {ThumbNode[]} searchResults
   * @param {Number} pageNumber
   * @param {HTMLElement} container
   */
  updateVisibilityOfPageTraversalButtons(end, searchResults, pageNumber, container) {
    const onFinalPage = end >= searchResults.length;
    const onFirstPage = pageNumber === 1;

    const pageButtons = Array.from(container.children);

    for (const element of pageButtons.slice(0, 2)) {
      element.style.display = onFirstPage ? "none" : "";
    }

    for (const element of pageButtons.slice(-2)) {
      element.style.display = onFinalPage ? "none" : "";
    }
  }
}

const favoritesLoader = new FavoritesLoader();
