class FavoritesLoader {
  /**
   * @type {EventEmitter}
   */
  network;
  /**
   * @type {FavoritesFetcher}
   */
  fetcher;
  /**
   * @type {FetchedFavoritesQueue}
   */
  fetchedQueue;
  /**
   * @type {FavoritesDatabaseInterface}
   */
  database;
  /**
   * @type {Post[]}
   */
  allFavorites;

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
   * @param {EventEmitter} network
   */
  constructor(network) {
    this.network = network;
    this.allFavorites = [];
    this.network.on(Channels.favorites.modelToLoader, (/** @type {Message} */ message) => Utils.handleMessage(this, message));

    this.fetchedQueue = new FetchedFavoritesQueue({
      /**
       * @param {FavoritesPageRequest} request
       */
      onDequeue: (request) => {
        this.allFavorites = this.allFavorites.concat(request.favorites);
        this.sendMessageToModel("onFavoritesFound", request.favorites);
      }
    });
    this.fetcher = new FavoritesFetcher({
      onAllRequestsCompleted: () => {
        this.database.storeAllFavorites(this.allFavorites);
        this.relayMessageThroughModel("onAllFavoritesFound");
      },
      /**
       * @param {FavoritesPageRequest} request
       */
      onRequestCompleted: (request) => {
        this.fetchedQueue.enqueue(request);
      },
      /**
       * @param {Post[]} favorites
       */
      onFavoritesFoundOnReload: (favorites) => {
        this.sendMessageToModel("onFavoritesFoundOnReload", favorites);

        if (favorites.length > 0) {
          this.database.storeFavorites(favorites);
        }
      }
    });
    this.database = new FavoritesDatabaseInterface({
      onFavoritesStored: () => {
        setTimeout(() => {
          this.sendMessageToModel("notify", "All favorites saved");
        }, 500);
      },
      /**
       * @param {Post[]} favorites
       */
      onFavoritesLoaded: (favorites) => {
        this.relayMessageThroughModel("onFinishedAccessingDatabase");

        if (favorites.length === 0) {
          this.relayMessageThroughModel("onStartedFetchingFavorites");
          this.fetcher.fetchAllFavorites();
          return;
        }
        this.allFavorites = favorites;
        this.fetcher.fetchNewFavoritesOnReload(this.allFavoriteIds);
        this.relayMessageThroughModel("onFavoritesLoaded");
      }
    });
  }

  /**
   * @param {String} name
   * @param {Object} detail
   */
  sendMessageToModel(name, detail) {
    this.network.sendMessage(Channels.favorites.loaderToModel, name, detail);
  }

  /**
   * @param {String} message
   */
  relayMessageThroughModel(message) {
    this.network.sendMessage(Channels.favorites.loaderToModel, "relay", message);
  }

  /**
   * @returns {Post[]}
   */
  getAllFavorites() {
    return this.allFavorites;
  }

  loadFavorites() {
    this.database.loadAllFavorites();
  }
}
