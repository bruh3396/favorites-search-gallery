class FavoritesLoader {
  static states = {
    initial: 0,
    retrievingDatabaseStatus: 1,
    fetchingFavorites: 2,
    loadingFavoritesFromDatabase: 3,
    allFavoritesLoaded: 4
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

  /**
   * @type {Post[]}
   */
  get getFavoritesMatchedByLastSearch() {
    return this.allFavorites.filter(post => post.matchedByMostRecentSearch);
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
    this.favoriteIdsRequiringMetadataDatabaseUpdate = [];
    this.matchCountLabel = document.getElementById("match-count-label");
    this.allowedRatings = Utils.loadAllowedRatings();
    this.expectedFavoritesCount = null;
    this.matchedFavoritesCount = 0;
    this.searchQuery = "";
  }

  initializeComponents() {
    this.fetchedQueue = new FetchedFavoritesQueue((request) => {
      this.processFetchedFavorites(request.fetchedFavorites);
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
    window.addEventListener("missingMetadata", (event) => {
      this.addNewMetadata(event.detail);
    });
    window.addEventListener("reachedEndOfGallery", (event) => {
      this.paginator.changePageWhileInGallery(event.detail, this.latestSearchResults);
    });
  }

  setExpectedFavoritesCount() {
    const profileURL = `https://rule34.xxx/index.php?page=account&s=profile&id=${Utils.getFavoritesPageId()}`;

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
    const databaseStatus = await this.database.initializeDatabase();

    if (databaseStatus.objectStoreIsEmpty) {
      this.fetchAllFavorites();
    } else {
      this.loadAllFavoritesFromDatabase();
    }
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
    const invertedSearchResults = this.getFavoritesMatchedByLastSearch;

    this.searchFlags.searchResultsAreInverted = true;
    this.paginateSearchResults(invertedSearchResults);
    window.scrollTo(0, 0);
  }

  shuffleSearchResults() {
    const matchedPosts = this.getFavoritesMatchedByLastSearch;

    Utils.shuffleArray(matchedPosts);
    this.searchFlags.searchResultsAreShuffled = true;
    this.paginateSearchResults(matchedPosts);
  }

  onAllFavoritesFetched() {
    this.latestSearchResults = this.getResultsWithAllowedRatings(this.searchResultsWhileFetching);
    dispatchEvent(new CustomEvent("newSearchResults", {
      detail: this.latestSearchResults
    }));
    this.onAllFavoritesLoaded();
    this.database.storeAllFavorites(this.allFavorites);
    this.setStatusText("Saving favorites");
  }

  /**
   * @param {Object[]} favorites
   */
  onAllFavoritesLoadedFromDatabase(favorites) {
    this.paginateSearchResults(this.reconstructContent(favorites));
    this.toggleLoadingUI(false);
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
    this.setStatusText(value ? "Loading favorites" : "All favorites loaded");
  }

  /**
   * @param {Object[]} databaseRecords
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
    this.database.loadAllFavorites();
  }

  /**
   * @param {Boolean} value
   */
  showLoadingWheel(value) {
    document.getElementById("loading-wheel").style.display = value ? "flex" : "none";
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
      await Utils.sleep(metadataPopulateWaitTime);
    }

    for (const post of newPosts) {
      if (this.matchesSearchAndRating(searchCommand, post)) {
        this.paginator.insertNewFavorite(post);
        insertedPosts.push(post);
      }
    }
    this.paginator.createPaginationMenu(this.paginator.currentPageNumber, this.getFavoritesMatchedByLastSearch);
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
    const sortingMethod = Utils.getSortingMethod();

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
    const matchedPosts = this.getFavoritesMatchedByLastSearch;

    this.paginateSearchResults(matchedPosts);
    dispatchEvent(new Event("sortingParametersChanged"));
  }

  /**
   * @param {Number} allowedRatings
   */
  onAllowedRatingsChanged(allowedRatings) {
    this.allowedRatings = allowedRatings;
    this.searchFlags.allowedRatingsWereChanged = true;
    const matchedPosts = this.getFavoritesMatchedByLastSearch;

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
    this.database.updateFavorites(this.favoriteIdsRequiringMetadataDatabaseUpdate.map(id => Post.allPosts.get(id)));
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
