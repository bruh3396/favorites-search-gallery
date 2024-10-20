class FavoriteMetadata {
  static parser = new DOMParser();
  /**
   * @type {FavoriteMetadata[]}
  */
  static missingMetadataFetchQueue = [];
  /**
   * @type {FavoriteMetadata[]}
  */
  static deletedPostFetchQueue = [];
  static currentlyFetchingFromQueue = false;
  static allFavoritesLoaded = false;
  static fetchDelay = {
    normal: 10,
    deleted: 300
  };
  static postStatisticsRegex = /Posted:\s*(\S+\s\S+).*Size:\s*(\d+)x(\d+).*Rating:\s*(\S+).*Score:\s*(\d+)/gm;

  /**
   * @param {FavoriteMetadata} favoriteMetadata
   */
  static async fetchMissingMetadata(favoriteMetadata) {
    if (favoriteMetadata !== undefined) {
      FavoriteMetadata.missingMetadataFetchQueue.push(favoriteMetadata);
    }

    if (FavoriteMetadata.currentlyFetchingFromQueue) {
      return;
    }
    FavoriteMetadata.currentlyFetchingFromQueue = true;

    while (FavoriteMetadata.missingMetadataFetchQueue.length > 0) {
      const metadata = this.missingMetadataFetchQueue.pop();

      if (metadata.postIsDeleted) {
        metadata.populateMetadataFromPost();
      } else {
        metadata.populateMetadataFromAPI(true);
      }
      await sleep(metadata.fetchDelay);
    }
    FavoriteMetadata.currentlyFetchingFromQueue = false;
  }

  /**
   * @param {String} rating
   * @returns {Number}
   */
  static encodeRating(rating) {
    return {
      "Explicit": 4,
      "E": 4,
      "e": 4,
      "Questionable": 2,
      "Q": 2,
      "q": 2,
      "Safe": 1,
      "S": 1,
      "s": 1
    }[rating] || 4;
  }

  static {
    window.addEventListener("favoritesLoaded", () => {
      FavoriteMetadata.allFavoritesLoaded = true;
      FavoriteMetadata.missingMetadataFetchQueue = FavoriteMetadata.missingMetadataFetchQueue.concat(FavoriteMetadata.deletedPostFetchQueue);
      FavoriteMetadata.fetchMissingMetadata();
    }, {
      once: true
    });
  }
  /**
   * @type {String}
  */
  id;
  /**
   * @type {Number}
  */
  width;
  /**
   * @type {Number}
  */
  height;
  /**
   * @type {Number}
  */
  score;
  /**
   * @type {Number}
  */
  rating;
  /**
   * @type {Number}
  */
  creationTimestamp;
  /**
   * @type {Number}
  */
  lastChangedTimestamp;
  /**
   * @type {Boolean}
  */
  postIsDeleted;

  /**
   * @returns {String}
  */

  get apiURL() {
    return `https://api.rule34.xxx//index.php?page=dapi&s=post&q=index&id=${this.id}`;
  }

  get postURL() {
    return `https://rule34.xxx/index.php?page=post&s=view&id=${this.id}`;
  }

  get fetchDelay() {
    return this.postIsDeleted ? FavoriteMetadata.fetchDelay.deleted : FavoriteMetadata.fetchDelay.normal;
  }

  /**
   * @type {String}
   */
  get json() {
    return JSON.stringify({
      width: this.width,
      height: this.height,
      score: this.score,
      rating: this.rating,
      create: this.creationTimestamp,
      change: this.lastChangedTimestamp,
      deleted: this.postIsDeleted
    });
  }

  /**
   * @type {Number}
   */
  get pixelCount() {
    return this.width * this.height;
  }

  /**
   * @param {String} id
   * @param {Object.<String, String>} record
   */
  constructor(id, record) {
    this.id = id;
    this.setDefaults();
    this.populateMetadata(record);
  }

  setDefaults() {
    this.width = 0;
    this.height = 0;
    this.score = 0;
    this.creationTimestamp = 0;
    this.lastChangedTimestamp = 0;
    // this.rating = 4;
    this.postIsDeleted = false;
  }

  /**
   * @param {Number} rating
   */
  presetRating(rating) {
    this.rating = rating;
  }

  /**
   * @param {Object.<String, String>} record
   */
  populateMetadata(record) {
    if (record === undefined) {
      this.populateMetadataFromAPI();
    } else if (record === null) {
      FavoriteMetadata.fetchMissingMetadata(this, true);
    } else {
      this.populateMetadataFromRecord(JSON.parse(record));

      if (this.isEmpty()) {
        FavoriteMetadata.fetchMissingMetadata(this, true);
      }
    }
  }

  /**
   * @param {Boolean} missingInDatabase
   */
  populateMetadataFromAPI(missingInDatabase = false) {
    fetch(this.apiURL)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        const dom = FavoriteMetadata.parser.parseFromString(html, "text/html");
        const metadata = dom.querySelector("post");

        if (metadata === null) {
          throw new Error(`metadata is null - ${this.apiURL}`, {
            cause: "DeletedMetadata"
          });
        }
        this.width = parseInt(metadata.getAttribute("width"));
        this.height = parseInt(metadata.getAttribute("height"));
        this.score = parseInt(metadata.getAttribute("score"));
        this.rating = FavoriteMetadata.encodeRating(metadata.getAttribute("rating"));
        this.creationTimestamp = Date.parse(metadata.getAttribute("created_at"));
        this.lastChangedTimestamp = parseInt(metadata.getAttribute("change"));

        const extension = getExtensionFromImageURL(metadata.getAttribute("file_url"));

        if (extension !== "mp4") {
          dispatchEvent(new CustomEvent("favoriteMetadataFetched", {
            detail: {
              id: this.id,
              extension
            }
          }));
        }

        if (missingInDatabase) {
          dispatchEvent(new CustomEvent("missingMetadata", {
            detail: this.id
          }));
        }
      })
      .catch((error) => {
        if (error.cause === "DeletedMetadata") {
          this.postIsDeleted = true;
          FavoriteMetadata.deletedPostFetchQueue.push(this);
        } else if (error.message === "Failed to fetch") {
          FavoriteMetadata.missingMetadataFetchQueue.push(this);
        } else {
          console.error(error);
        }
      });
  }

  /**
   * @param {Object.<String, String>} record
  */
  populateMetadataFromRecord(record) {
    this.width = record.width;
    this.height = record.height;
    this.score = record.score;
    this.rating = record.rating;
    this.creationTimestamp = record.create;
    this.lastChangedTimestamp = record.change;
    this.postIsDeleted = record.deleted;
  }

  populateMetadataFromPost() {
    fetch(this.postURL)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        const dom = FavoriteMetadata.parser.parseFromString(html, "text/html");
        const statistics = dom.getElementById("stats");

        if (statistics === null) {
          return;
        }
        const textContent = replaceLineBreaks(statistics.textContent.trim(), " ");
        const match = FavoriteMetadata.postStatisticsRegex.exec(textContent);

        FavoriteMetadata.postStatisticsRegex.lastIndex = 0;

        if (!match) {
          return;
        }
        this.width = parseInt(match[2]);
        this.height = parseInt(match[3]);
        this.score = parseInt(match[5]);
        this.rating = FavoriteMetadata.encodeRating(match[4]);
        this.creationTimestamp = Date.parse(match[1]);
        this.lastChangedTimestamp = this.creationTimestamp / 1000;

        if (FavoriteMetadata.allFavoritesLoaded) {
          dispatchEvent(new CustomEvent("missingMetadata", {
            detail: this.id
          }));
        }
      });
  }

  /**
   * @returns {Boolean}
   */
  isEmpty() {
    return this.width === 0 && this.height === 0;
  }

  /**
   * @param {{metric: String, operator: String, value: String, negated: Boolean}[]} filters
   * @returns {Boolean}
   */
  satisfiesAllFilters(filters) {
    for (const expression of filters) {
      if (!this.satisfiesExpression(expression)) {
        return false;
      }
    }
    return true;
  }

  /**
   * @param {{metric: String, operator: String, value: Number, negated: Boolean}} filter
   * @returns {Boolean}
   */
  satisfiesExpression(filter) {
    const metricMap = {
      "id": this.id,
      "width": this.width,
      "height": this.height,
      "score": this.score
    };
    const metricValue = metricMap[filter.metric] || 0;
    const value = metricMap[filter.value] || parseInt(filter.value);
    return this.evaluateExpression(metricValue, filter.operator, value, filter.negated);
  }

  /**
   * @param {Number} metricValue
   * @param {String} operator
   * @param {Number} value
   * @param {Number} negated
   * @returns {Boolean}
   */
  evaluateExpression(metricValue, operator, value, negated) {
    let result = true;

    switch (operator) {
      case ":":
        result = metricValue === value;
        break;

      case ":<":
        result = metricValue < value;
        break;

      case ":>":
        result = metricValue > value;
        break;

      default:
        break;
    }
    return negated ? !result : result;
  }
}
