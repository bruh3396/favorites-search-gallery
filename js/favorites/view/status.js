class FavoritesStatusBar {
  /** @type {HTMLElement | null} */
  matchCountIndicator;
  /** @type {HTMLElement | null} */
  statusIndicator;
  /** @type {Number | null} */
  expectedTotalFavoritesCount;
  /** @type {Timeout} */
  statusTimeout;

  constructor() {
    this.matchCountIndicator = document.getElementById("match-count-label");
    this.statusIndicator = document.getElementById("favorites-load-status-label");
    this.statusTimeout = null;
    this.expectedTotalFavoritesCount = null;
    Utils.getExpectedFavoritesCount()
      .then((expectedTotalFavoritesCount) => {
        this.expectedTotalFavoritesCount = expectedTotalFavoritesCount;
      });
  }

  /**
   * @param {String} text
   */
  setStatus(text) {
    if (this.statusIndicator === null) {
      console.error("Status indicator is null");
      return;
    }
    this.statusIndicator.textContent = text;
    clearTimeout(this.statusTimeout);
    this.statusTimeout = setTimeout(() => {
      this.setStatus("");
    }, 1500);
  }

  /**
   * @param {Number} value
   */
  setMatchCount(value) {
    if (this.matchCountIndicator === null) {
      console.error("Match count indicator is null");
      return;
    }
    this.matchCountIndicator.textContent = `${value} ${value === 1 ? "Match" : "Matches"}`;
  }

  enableSearchButtons() {
    dispatchEvent(new Event("readyToSearch"));
  }

  /**
   * @param {Number} searchResultsCount
   * @param {Number} favoritesFoundCount
   */
  updateStatusWhileFetching(searchResultsCount, favoritesFoundCount) {
    const prefix = Flags.onMobileDevice ? "" : "Favorites ";
    let statusText = `Fetching ${prefix}${favoritesFoundCount}`;

    if (this.expectedTotalFavoritesCount !== null) {
      statusText = `${statusText} / ${this.expectedTotalFavoritesCount}`;
    }
    this.setStatus(statusText);
    this.setMatchCount(searchResultsCount);
  }
}
