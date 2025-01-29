class FavoritesLoaderStatus {
  /**
   * @type {HTMLLabelElement}
   */
  matchCountIndicator;
  /**
   * @type {HTMLLabelElement}
   */
  statusIndicator;
  /**
   * @type {Number}
   */
  expectedTotalFavoritesCount;

  constructor() {
    this.initializeFields();
    this.extractElements();
  }

  initializeFields() {
    this.setExpectedFavoritesCount();
  }

  extractElements() {
    this.matchCountIndicator = document.getElementById("match-count-label");
    this.statusIndicator = document.getElementById("favorites-load-status-label");
  }

  setExpectedFavoritesCount() {
    Utils.getExpectedFavoritesCount()
      .then((favoritesCount) => {
        this.expectedTotalFavoritesCount = favoritesCount;
      });
  }

  /**
   * @param {String} text
   */
  setStatus(text) {
    this.statusIndicator.textContent = text;
  }

  /**
   * @param {Boolean} value
   * @param {Number} delay
   */
  async toggleStatusVisibility(value, delay = 0) {
    if (delay > 0) {
      await Utils.sleep(delay);
    }
    this.statusIndicator.style.display = value ? "inline-block" : "none";
  }

  /**
   * @param {Number} value
   */
  setMatchCount(value) {
    this.matchCountIndicator.textContent = `${value} ${value === 1 ? "Match" : "Matches"}`;
  }

  enableSearchButtons() {
    dispatchEvent(new Event("readyToSearch"));
  }

  notifyAllFavoritesSaved() {
    this.setStatus("All favorites saved");
    this.toggleStatusVisibility(false, 1000);
  }

  /**
   * @param {Number} favoritesFoundCount
   * @param {Number} searchResultsCount
   */
  updateStatusWhileFetching(favoritesFoundCount, searchResultsCount) {
    const prefix = Utils.onMobileDevice() ? "" : "Favorites ";
    let statusText = `Fetching ${prefix}${favoritesFoundCount}`;

    if (this.expectedTotalFavoritesCount !== null) {
      statusText = `${statusText} / ${this.expectedTotalFavoritesCount}`;
    }
    this.setStatus(statusText);
    this.setMatchCount(searchResultsCount);
  }
}
