class FavoritesLoader {
  static states = {
    initial: 0,
    fetchingFavorites: 1,
    loadingFavoritesFromDatabase: 2,
    allFavoritesLoaded: 3
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
   * @type {FavoritesDatabaseInterface}
   */
  database;
  /**
   * @type {FavoritesLoaderStatus}
   */
  status;
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
   * @type {String}
   */
  searchQuery;
  /**
   * @type {String}
   */
  negatedTagBlacklist;
  /**
   * @type {Boolean}
   */
  excludeBlacklistedTags;
  /**
   * @type {Number}
   */
  currentState;
  /**
   * @type {Number}
   */
  allowedRatings;
  /**
   * @type {Number}
   */
  expectedTotalFavoritesCount;

  /**
   * @type {String}
   */
  get finalSearchQuery() {
    return this.excludeBlacklistedTags ? this.searchQueryWithBlacklist : this.searchQuery;
  }

  /**
   * @type {String}
   */
  get searchQueryWithBlacklist() {
    return `${this.searchQuery} ${this.negatedTagBlacklist}`;
  }

  /**
   * @returns {SearchCommand}
   */
  get searchCommand() {
    return new SearchCommand(this.finalSearchQuery);
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
  get favoritesMatchedByLatestSearch() {
    return this.allFavorites.filter(post => post.matchedByLatestSearch);
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
    this.allowedRatings = Utils.loadAllowedRatings();
    this.expectedTotalFavoritesCount = null;
    this.searchQuery = "";
    this.negatedTagBlacklist = Utils.negateTags(Utils.tagBlacklist);
    this.excludeBlacklistedTags = !Utils.userIsOnTheirOwnFavoritesPage() || Utils.getPreference("excludeBlacklist", false);
    this.currentState = FavoritesLoader.states.initial;
  }

  initializeComponents() {
    this.status = new FavoritesLoaderStatus();
    this.fetchedQueue = new FetchedFavoritesQueue((request) => {
      this.processFetchedFavorites(request.favorites);
    });
    this.fetcher = new FavoritesFetcher(() => {
      this.processAllFetchedFavorites();
    }, (request) => {
      this.fetchedQueue.enqueue(request);
    });
    this.paginator = new FavoritesPaginator();
    this.searchFlags = new FavoritesSearchFlags();
    this.database = new FavoritesDatabaseInterface(() => {
      this.status.notifyAllFavoritesStored();
    }, (favorites) => {
      this.processFavoritesLoadedFromDatabase(favorites);
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
    window.addEventListener("changedPageRaw", () => {
      if (this.currentState !== FavoritesLoader.states.loadingFavoritesFromDatabase) {
        dispatchEvent(new Event("changedPage"));
      }
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
    this.handleSearchByState();
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

  handleSearchByState() {
    switch (this.currentState) {
      case FavoritesLoader.states.initial:
        this.showSearchResultsAfterLoadingFromDatabase();
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
        break;
    }
  }

  showSearchResultsAfterLoadingFromDatabase() {
    this.currentState = FavoritesLoader.states.loadingFavoritesFromDatabase;
    this.toggleLoadingIndicator(true);
    this.status.setStatus("Loading favorites");
    this.database.loadAllFavorites();
  }

  showSearchResultsWhileFetchingFavorites() {
    this.searchResultsWhileFetching = this.searchCommand.getSearchResults(this.allFavorites);
    this.showSearchResults(this.searchResultsWhileFetching);
  }

  showSearchResultsAfterAllFavoritesLoaded() {
    this.showSearchResults(this.searchCommand.getSearchResults(this.allFavorites));
  }

  /**
   * @param {Post[]} searchResults
   */

  showSearchResults(searchResults) {
    if (!this.searchFlags.aNewSearchCouldProduceDifferentResults) {
      return;
    }
    searchResults = this.sortPosts(searchResults);
    searchResults = this.filterResultsByAllowedRatings(searchResults);
    this.latestSearchResults = searchResults;
    this.status.setMatchCount(searchResults.length);
    this.paginator.paginate(searchResults);
    this.searchFlags.reset();
    Utils.broadcastEvent("newSearchResults", searchResults);
  }

  /**
   * @param {Post[]} favorites
   */
  processFavoritesLoadedFromDatabase(favorites) {
    const noFavoritesFound = favorites.length === 0;

    this.toggleLoadingIndicator(false);
    this.status.enableSearchButtons();

    if (noFavoritesFound) {
      this.startFetchingAllFavorites();
      return;
    }
    const nonBlackListedFavorites = this.searchCommand.getSearchResults(favorites);

    this.allFavorites = Utils.userIsOnTheirOwnFavoritesPage() ? favorites : nonBlackListedFavorites;
    this.status.setStatus("All favorites loaded");
    this.showSearchResults(nonBlackListedFavorites);
    dispatchEvent(new Event("favoritesLoadedFromDatabase"));
    this.currentState = FavoritesLoader.states.allFavoritesLoaded;
    this.searchFlags.allFavoritesLoaded = true;
    Utils.broadcastEvent("favoritesLoaded");
    this.fetchNewFavoritesOnReload();
  }

  setupPaginationMenu() {
    this.paginator.toggleContentVisibility(true);
    this.paginator.insertMenu();
    this.paginator.updateMenu(1, []);
  }

  startFetchingAllFavorites() {
    this.currentState = FavoritesLoader.states.fetchingFavorites;
    this.setupPaginationMenu();
    Utils.broadcastEvent("startedFetchingFavorites");
    this.fetcher.fetchAllFavorites();
  }

  /**
   * @param {Post[]} favorites
   */
  processFetchedFavorites(favorites) {
    const matchedFavorites = this.searchCommand.getSearchResults(favorites);

    this.searchResultsWhileFetching = this.searchResultsWhileFetching.concat(matchedFavorites);
    const searchResults = this.filterResultsByAllowedRatings(this.searchResultsWhileFetching);

    this.status.setMatchCount(searchResults.length);
    this.allFavorites = this.allFavorites.concat(favorites);
    this.paginator.paginateWhileFetching(searchResults);
    this.updateStatusWhileFetching();
    dispatchEvent(new CustomEvent("favoritesFetched", {
      detail: favorites.map(post => post.root)
    }));
  }

  processAllFetchedFavorites() {
    this.currentState = FavoritesLoader.states.allFavoritesLoaded;
    this.searchFlags.allFavoritesLoaded = true;
    this.latestSearchResults = this.filterResultsByAllowedRatings(this.searchResultsWhileFetching);
    Utils.broadcastEvent("newSearchResults", this.latestSearchResults);
    this.status.enableSearchButtons();
    Utils.broadcastEvent("favoritesLoaded");
    this.database.storeAllFavorites(this.allFavorites);
    this.status.setStatus("Saving favorites");
  }

  fetchNewFavoritesOnReload() {
    this.fetcher.onAllRequestsCompleted = (newFavorites) => {
      this.processNewFavoritesFoundOnReload(newFavorites);
    };
    this.fetcher.fetchNewFavoritesOnReload(this.allFavoriteIds);
  }

  /**
   * @param {Post[]} newFavorites
   */
  processNewFavoritesFoundOnReload(newFavorites) {
    if (newFavorites.length === 0) {
      this.status.toggleStatusVisibility(false);
      return;
    }
    this.allFavorites = newFavorites.concat(this.allFavorites);
    this.latestSearchResults = newFavorites.concat(this.latestSearchResults);
    this.status.setStatus(`Found ${newFavorites.length} new favorite${newFavorites.length === 1 ? "" : "s"}`);
    this.status.toggleStatusVisibility(false, 1000);
    this.database.storeFavorites(newFavorites);
    this.insertNewFavoritesFoundOnReload(newFavorites);
  }

  updateStatusWhileFetching() {
    const prefix = Utils.onMobileDevice() ? "" : "Favorites ";
    let statusText = `Fetching ${prefix}${this.allFavorites.length}`;

    if (this.expectedTotalFavoritesCount !== null) {
      statusText = `${statusText} / ${this.expectedTotalFavoritesCount}`;
    }
    this.status.setStatus(statusText);
  }

  /**
   * @param {Boolean} value
   */
  toggleLoadingIndicator(value) {
    this.paginator.toggleContentVisibility(!value);
    Utils.toggleLoadingWheel(value);
  }

  /**
   * @param {Post[]} newFavorites
   */
  async insertNewFavoritesFoundOnReload(newFavorites) {
    const searchCommand = this.searchCommand;
    const insertedFavorites = [];
    const metadataPopulateWaitTime = 1000;

    newFavorites.reverse();

    if (!this.allRatingsAreAllowed) {
      await Utils.sleep(metadataPopulateWaitTime);
    }

    for (const favorite of newFavorites) {
      if (this.ratingIsAllowed(favorite) && searchCommand.matches(favorite)) {
        this.paginator.insertNewFavorite(favorite);
        insertedFavorites.push(favorite);
      }
    }
    this.paginator.updateMenu(this.paginator.currentPageNumber, this.favoritesMatchedByLatestSearch);
    Utils.broadcastEvent("newFavoritesFoundOnReload", insertedFavorites.map(post => post.root));
    Utils.broadcastEvent("newSearchResults", this.latestSearchResults);
  }

  /**
   * @param {Post[]} posts
   * @returns {Post[]}
   */
  sortPosts(posts) {
    if (this.searchFlags.searchResultsAreShuffled) {
      return posts;
    }
    return FavoritesSorter.sort(posts);
  }

  /**
   * @param {String} name
   * @param {any} value
   */
  onOptionChanged(name, value) {
    switch (name) {
      case "blacklist":
        this.excludeBlacklistedTags = value;
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
        this.showSearchResults(this.favoritesMatchedByLatestSearch);
        dispatchEvent(new Event("sortingParametersChanged"));
        break;

      case "allowedRatings":
        this.allowedRatings = value;
        this.searchFlags.allowedRatingsWereChanged = true;
        this.showSearchResults(this.favoritesMatchedByLatestSearch);
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
  filterResultsByAllowedRatings(searchResults) {
    if (this.allRatingsAreAllowed) {
      return searchResults;
    }
    return searchResults.filter(post => this.ratingIsAllowed(post));
  }

  invertSearchResults() {
    this.status.setMatchCount(0);
    this.allFavorites.forEach((post) => {
      post.toggleMatched();
    });
    const invertedSearchResults = this.favoritesMatchedByLatestSearch;

    this.searchFlags.searchResultsAreInverted = true;
    this.showSearchResults(invertedSearchResults);
    window.scrollTo(0, 0);
  }

  shuffleSearchResults() {
    const matchedPosts = this.favoritesMatchedByLatestSearch;

    Utils.shuffleArray(matchedPosts);
    this.searchFlags.searchResultsAreShuffled = true;
    this.showSearchResults(matchedPosts);
  }

  /**
   * @param {String} id
   */
  findFavorite(id) {
    this.paginator.findFavorite(id, this.latestSearchResults);
  }
}
