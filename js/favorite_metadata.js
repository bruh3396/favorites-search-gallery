class FavoriteMetadata {
  static parser = new DOMParser();
  /**
   * @type {FavoriteMetadata[]}
  */
  static fetchQueue = [];
  static currentlyFetching = false;
  static fetchDelay = {
    normal: 5,
    deleted: 300
  };
  static postStatisticsRegex = /Posted:\s*(\S+\s\S+).*Size:\s*(\d+)x(\d+).*Rating:\s*(\S+).*Score:\s*(\d+)/gm;

  /**
   * @param {FavoriteMetadata} favoriteMetadata
   * @param {Boolean} missingInDatabase
   */
  static async fetchMissingMetadata(favoriteMetadata, missingInDatabase = false) {
    FavoriteMetadata.fetchQueue.push(favoriteMetadata);

    if (FavoriteMetadata.currentlyFetching) {
      return;
    }
    FavoriteMetadata.currentlyFetching = true;

    while (FavoriteMetadata.fetchQueue.length > 0) {
      const metadata = this.fetchQueue.pop();

      if (metadata.postIsDeleted) {
        metadata.populateMetadataFromPost(missingInDatabase);
      } else {
        metadata.populateMetadataFromAPI(true);
      }
      await sleep(metadata.fetchDelay);
    }
    FavoriteMetadata.currentlyFetching = false;
  }

  /**
  * @param {String} imageURL
  * @returns {String}
  */
  static getExtensionFromFileURL(imageURL) {
    try {
      return (/\.(png|jpg|jpeg|gif|mp4)/g).exec(imageURL)[1];

    } catch (error) {
      return "jpg";
    }
  }

  /**
   * @param {String} rating
   * @returns {Number}
   */
  static convertRatingToNumber(rating) {
    return {
      "Explicit": 4,
      "e": 4,
      "Questionable": 2,
      "q": 2,
      "Safe": 1,
      "s": 1
    }[rating] || 4;
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
    this.rating = 4;
    this.postIsDeleted = false;
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

      if (this.metadataIsEmpty()) {
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
        this.rating = FavoriteMetadata.convertRatingToNumber(metadata.getAttribute("rating"));
        this.creationTimestamp = Date.parse(metadata.getAttribute("created_at"));
        this.lastChangedTimestamp = parseInt(metadata.getAttribute("change"));

        const extension = FavoriteMetadata.getExtensionFromFileURL(metadata.getAttribute("file_url"));

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
          // FavoriteMetadata.fetchMissingMetadata(this);
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

  /**
   * @param {Boolean} missingInDatabase
   */
  populateMetadataFromPost(missingInDatabase = false) {
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
        this.rating = FavoriteMetadata.convertRatingToNumber(match[4]);
        this.creationTimestamp = Date.parse(match[1]);
        this.lastChangedTimestamp = this.creationTimestamp;

        if (missingInDatabase) {
          dispatchEvent(new CustomEvent("missingMetadata", {
            detail: this.id
          }));
        }
      });
  }

  /**
   * @returns {Boolean}
   */
  metadataIsEmpty() {
    return this.width === 0 && this.height === 0;
  }
}
