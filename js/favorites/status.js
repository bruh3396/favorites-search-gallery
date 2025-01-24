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
  matchCount;

  /**
   * @type {Boolean}
   */
  get matchCountIndicatorElementExists() {
    if (this.matchCountIndicator === null || !document.contains(this.matchCountIndicator)) {
      this.matchCountIndicator = document.getElementById("match-count-label");

      if (this.matchCountIndicator === null) {
        return false;
      }
    }
    return true;
  }

  constructor() {
    this.matchCountIndicator = document.getElementById("match-count-label");
    this.statusIndicator = document.getElementById("favorites-load-status-label");
    this.matchCount = 0;
  }

  /**
   * @param {String} text
   * @param {Number} delay
   */
  async setStatus(text, delay) {
    if (delay !== undefined && delay > 0) {
      await Utils.sleep(delay);
    }
    document.getElementById("favorites-load-status-label").textContent = text;
  }

  /**
   * @param {Boolean} value
   * @param {Number} delay
   */
  async toggleStatusVisibility(value, delay) {
    if (delay !== undefined && delay > 0) {
      await Utils.sleep(delay);
    }
    this.statusIndicator.style.display = value ? "inline-block" : "none";
  }

  /**
   * @param {Number} value
   */
  setMatchCount(value) {
    if (this.matchCountIndicatorElementExists) {
      this.matchCount = value === undefined ? this.getSearchResults(this.allFavorites).length : value;
      this.matchCountIndicator.textContent = `${this.matchCount} ${this.matchCount === 1 ? "Match" : "Matches"}`;
    }
  }

  enableSearchButtons() {
    dispatchEvent(new Event("readyToSearch"));
  }

  notifyAllFavoritesStored() {
    this.setStatus("All favorites saved");
    this.toggleStatusVisibility(false, 1000);
  }
}
