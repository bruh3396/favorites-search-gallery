class FavoritesLoader {
  static states = {
    initial: 0,
    fetchingFavorites: 1,
    loadingFavoritesFromDatabase: 2,
    allFavoritesLoaded: 3
  };
  static currentState = FavoritesLoader.states.initial;
  static tagNegation = {
    useTagBlacklist: true,
    negatedTagBlacklist: Utils.negateTags(Utils.tagBlacklist)
  };

  static get disabled() {
    return !Utils.onFavoritesPage();
  }

  /**
   * @type {FavoritesFetcher}
   */
  fetcher;
  /**
   * @type {FetchedFavoritesQueue}
   */
  fetchedQueue;
  /**
   * @type {FavoritesPaginator}
   */
  paginator;
  /**
   * @type {FavoritesSearchFlags}
   */
  searchFlags;
  /**
   * @type {FavoritesDatabaseWrapper}
   */
  database;
  /**
   * @type {Post[]}
   */
  allFavorites;
  /**
   * @type {Post[]}
   */
  latestSearchResults;
  /**
   * @type {Post[]}
   */
  searchResultsWhileFetching;
  /**
   * @type {HTMLLabelElement}
   */
  matchCountLabel;
  /**
   * @type {String}
   */
  searchQuery;
  /**
   * @type {Number}
   */
  allowedRatings;
  /**
   * @type {Number}
   */
  searchResultCount;
  /**
   * @type {Number}
   */
  expectedTotalFavoritesCount;

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
    if (this.matchCountLabel === null || !document.contains(this.matchCountLabel)) {
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

  /**
   * @type {Post[]}
   */
  get favoritesMatchedByLastSearch() {
    return this.allFavorites.filter(post => post.matchedByMostRecentSearch);
  }

  /**
   * @type {Boolean}
   */
  get allRatingsAreAllowed() {
    return this.allowedRatings === 7;
  }

  constructor() {
    if (FavoritesLoader.disabled) {
      return;
    }
    this.initializeFields();
    this.initializeComponents();
    this.addEventListeners();
    this.setExpectedFavoritesCount();
    Utils.clearOriginalFavoritesPage();
    this.searchFavorites();
  }

  initializeFields() {
    this.allFavorites = [];
    this.latestSearchResults = [];
    this.searchResultsWhileFetching = [];
    this.matchCountLabel = document.getElementById("match-count-label");
    this.allowedRatings = Utils.loadAllowedRatings();
    this.expectedTotalFavoritesCount = null;
    this.searchResultCount = 0;
    this.searchQuery = "";
  }

  initializeComponents() {
    this.fetchedQueue = new FetchedFavoritesQueue((request) => {
      this.processFetchedFavorites(request.favorites);
    });
    this.fetcher = new FavoritesFetcher(() => {
      this.onAllFavoritesFetched();
    }, (request) => {
      this.fetchedQueue.enqueue(request);
    });
    this.paginator = new FavoritesPaginator();
    this.searchFlags = new FavoritesSearchFlags();
    this.database = new FavoritesDatabaseWrapper(() => {
      this.onFavoritesStoredToDatabase();
    }, (favorites) => {
      this.onAllFavoritesLoadedFromDatabase(favorites);
    });
  }

  addEventListeners() {
    window.addEventListener("modifiedTags", () => {
      this.searchFlags.tagsWereModified = true;
    });
    window.addEventListener("reachedEndOfGallery", (event) => {
      this.paginator.changePageWhileInGallery(event.detail, this.latestSearchResults);
    });
    window.addEventListener("missingMetadata", (event) => {
      this.database.addNewMetadata(event.detail);
    });
  }

  setExpectedFavoritesCount() {
    Utils.getExpectedFavoritesCount()
      .then((favoritesCount) => {
        this.expectedTotalFavoritesCount = favoritesCount;
      });
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
        this.loadAllFavoritesFromDatabase();
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
    this.fetcher.onAllRequestsCompleted = (newFavorites) => {
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
      this.toggleStatusText(false);
      return;
    }
    this.setStatusText(`Found ${newFavorites.length} new favorite${newFavorites.length === 1 ? "" : "s"}`);
    this.toggleStatusText(false, 1000);
    this.database.storeFavorites(newFavorites);
    this.insertNewFavorites(newFavorites);
  }

  fetchAllFavorites() {
    FavoritesLoader.currentState = FavoritesLoader.states.fetchingFavorites;
    this.paginator.toggleContentVisibility(true);
    this.paginator.insertPaginationMenu();
    this.paginator.updatePaginationMenu(1, []);
    this.fetcher.fetchAllFavorites();
    dispatchEvent(new Event("readyToSearch"));
    setTimeout(() => {
      dispatchEvent(new Event("startedFetchingFavorites"));
    }, 50);
  }

  updateStatusWhileFetching() {
    const prefix = Utils.onMobileDevice() ? "" : "Favorites ";
    let statusText = `Fetching ${prefix}${this.allFavorites.length}`;

    if (this.expectedTotalFavoritesCount !== null) {
      statusText = `${statusText} / ${this.expectedTotalFavoritesCount}`;
    }
    this.setStatusText(statusText);
  }

  /**
   * @param {Post[]} favorites
   */
  processFetchedFavorites(favorites) {
    const matchedFavorites = this.getSearchResults(favorites);

    this.searchResultsWhileFetching = this.searchResultsWhileFetching.concat(matchedFavorites);
    const searchResults = this.getSearchResultsWithAllowedRatings(this.searchResultsWhileFetching);

    this.updateMatchCount(searchResults.length);
    this.allFavorites = this.allFavorites.concat(favorites);
    this.paginator.paginateWhileFetching(searchResults);
    this.updateStatusWhileFetching();
    dispatchEvent(new CustomEvent("favoritesFetched", {
      detail: favorites.map(post => post.root)
    }));
  }

  invertSearchResults() {
    this.updateMatchCount(0);
    this.allFavorites.forEach((post) => {
      post.toggleMatched();
    });
    const invertedSearchResults = this.favoritesMatchedByLastSearch;

    this.searchFlags.searchResultsAreInverted = true;
    this.paginateSearchResults(invertedSearchResults);
    window.scrollTo(0, 0);
  }

  shuffleSearchResults() {
    const matchedPosts = this.favoritesMatchedByLastSearch;

    Utils.shuffleArray(matchedPosts);
    this.searchFlags.searchResultsAreShuffled = true;
    this.paginateSearchResults(matchedPosts);
  }

  onAllFavoritesFetched() {
    this.latestSearchResults = this.getSearchResultsWithAllowedRatings(this.searchResultsWhileFetching);
    dispatchEvent(new CustomEvent("newSearchResults", {
      detail: this.latestSearchResults
    }));
    this.onAllFavoritesLoaded();
    this.database.storeAllFavorites(this.allFavorites);
    this.setStatusText("Saving favorites");
  }

  /**
   * @param {Object[]} databaseRecords
   */
  onAllFavoritesLoadedFromDatabase(databaseRecords) {
    this.toggleLoadingUI(false);

    if (databaseRecords.length === 0) {
      this.fetchAllFavorites();
      return;
    }
    this.setStatusText("All favorites loaded");
    this.paginateSearchResults(this.deserializeFavorites(databaseRecords));
    dispatchEvent(new Event("favoritesLoadedFromDatabase"));
    this.onAllFavoritesLoaded();
    setTimeout(() => {
      this.fetchNewFavoritesOnReload();
    }, 100);
  }

  onFavoritesStoredToDatabase() {
    this.setStatusText("All favorites saved");
    this.toggleStatusText(false, 1000);
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
  }

  /**
   * @param {Object[]} records
   * @returns {Post[]}}
   */
  deserializeFavorites(records) {
    const searchCommand = new SearchCommand(this.finalSearchQuery);
    const searchResults = [];

    for (const record of records) {
      const post = new Post(record, true);
      const isBlacklisted = !searchCommand.matches(post);

      if (isBlacklisted) {
        if (!Utils.userIsOnTheirOwnFavoritesPage()) {
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

  loadAllFavoritesFromDatabase() {
    FavoritesLoader.currentState = FavoritesLoader.states.loadingFavoritesFromDatabase;
    this.toggleLoadingUI(true);
    this.setStatusText("Loading favorites");
    this.database.loadAllFavorites();
  }

  /**
   * @param {Boolean} value
   */
  showLoadingWheel(value) {
    Utils.insertStyleHTML(`
      #loading-wheel {
        display: ${value ? "flex" : "none"};
      }
      `, "loading-wheel-display");
  }

  /**
   * @param {Boolean} value
   * @param {Number} delay
   */
  async toggleStatusText(value, delay) {
    if (delay !== undefined && delay > 0) {
      await Utils.sleep(delay);
    }
    document.getElementById("favorites-load-status-label").style.display = value ? "inline-block" : "none";
  }

  /**
   * @param {String} text
   * @param {Number} delay
   */
  async setStatusText(text, delay) {
    if (delay !== undefined && delay > 0) {
      await Utils.sleep(delay);
    }
    document.getElementById("favorites-load-status-label").textContent = text;
  }

  /**
   * @param {Number} value
   */
  updateMatchCount(value) {
    if (this.matchCountLabelExists) {
      this.searchResultCount = value === undefined ? this.getSearchResults(this.allFavorites).length : value;
      this.matchCountLabel.textContent = `${this.searchResultCount} ${this.searchResultCount === 1 ? "Match" : "Matches"}`;
    }
  }

  /**
   * @param {Number} value
   */
  incrementMatchCount(value) {
    if (this.matchCountLabelExists) {
      this.searchResultCount += value === undefined ? 1 : value;
      this.matchCountLabel.textContent = `${this.searchResultCount} Matches`;
    }
  }

  /**
   * @param {Post[]} newPosts
   */
  async insertNewFavorites(newPosts) {
    const searchCommand = new SearchCommand(this.finalSearchQuery);
    const insertedPosts = [];
    const metadataPopulateWaitTime = 1000;

    newPosts.reverse();

    if (!this.allRatingsAreAllowed) {
      await Utils.sleep(metadataPopulateWaitTime);
    }

    for (const post of newPosts) {
      if (this.ratingIsAllowed(post) && searchCommand.matches(post)) {
        this.paginator.insertNewFavorite(post);
        insertedPosts.push(post);
      }
    }
    this.paginator.updatePaginationMenu(this.paginator.currentPageNumber, this.favoritesMatchedByLastSearch);
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
   * @param {Post[]} searchResults
   */
  paginateSearchResults(searchResults) {
    if (!this.searchFlags.aNewSearchCouldProduceDifferentResults) {
      return;
    }

    if (!this.searchFlags.searchResultsAreShuffled) {
      searchResults = PostSorter.sortSearchResults(searchResults);
    }
    searchResults = this.getSearchResultsWithAllowedRatings(searchResults);
    this.latestSearchResults = searchResults;
    this.updateMatchCount(searchResults.length);
    this.paginator.paginate(searchResults);
    this.searchFlags.reset();
    dispatchEvent(new CustomEvent("newSearchResults", {
      detail: searchResults
    }));
  }

  /**
   * @param {String} name
   * @param {any} value
   */
  onOptionChanged(name, value) {
    switch (name) {
      case "blacklist":
        FavoritesLoader.tagNegation.useTagBlacklist = value;
        this.searchFlags.excludeBlacklistWasClicked = true;
        this.searchFavorites();
        break;

      case "resultsPerPage":
        this.paginator.maxFavoritesPerPage = value;
        this.searchFlags.recentlyChangedResultsPerPage = true;
        this.searchFavorites();
        break;

      case "sortingParameters":
        this.searchFlags.sortingParametersWereChanged = true;
        this.paginateSearchResults(this.favoritesMatchedByLastSearch);
        dispatchEvent(new Event("sortingParametersChanged"));
        break;

      case "allowedRatings":
        this.allowedRatings = value;
        this.searchFlags.allowedRatingsWereChanged = true;
        this.paginateSearchResults(this.favoritesMatchedByLastSearch);
        break;

      default:
        console.error(name);
        break;
    }
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  ratingIsAllowed(post) {
    if (this.allRatingsAreAllowed) {
      return true;
    }
    // eslint-disable-next-line no-bitwise
    return (post.metadata.rating & this.allowedRatings) > 0;
  }

  /**
   * @param {Post[]} searchResults
   * @returns {Post[]}
   */
  getSearchResultsWithAllowedRatings(searchResults) {
    if (this.allRatingsAreAllowed) {
      return searchResults;
    }
    return searchResults.filter(post => this.ratingIsAllowed(post));
  }

  /**
   * @param {String} id
   */
  findFavorite(id) {
    this.paginator.findFavorite(id, this.latestSearchResults);
  }
}
