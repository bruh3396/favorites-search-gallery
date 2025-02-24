class PostMetadata {
  /**
   * @type {Map.<String, PostMetadata>}
   */
  static allMetadata = new Map();
  /**
   * @type {Set.<String>}
   */
  static pendingRequests = new Set();
  static parser = new DOMParser();
  /**
   * @type {PostMetadata[]}
   */
  static missingMetadataFetchQueue = [];
  /**
   * @type {PostMetadata[]}
   */
  static deletedPostFetchQueue = [];
  static currentlyFetchingFromQueue = false;
  static allFavoritesLoaded = false;
  static fetchDelay = {
    normal: 25,
    deleted: 300
  };
  static postStatisticsRegex = /Posted:\s*(\S+\s\S+).*Size:\s*(\d+)x(\d+).*Rating:\s*(\S+).*Score:\s*(\d+)/gm;
  static async fetchAllMissingMetadata() {
    if (PostMetadata.currentlyFetchingFromQueue) {
      return;
    }
    PostMetadata.currentlyFetchingFromQueue = true;

    while (PostMetadata.missingMetadataFetchQueue.length > 0) {
      const metadata = this.missingMetadataFetchQueue.pop();

      if (metadata === undefined) {
        continue;
      }

      if (metadata.postIsDeleted) {
        metadata.populateMetadataFromPost();
      } else {
        metadata.populateMetadataFromAPI()
          .then(() => {
            Utils.broadcastEvent("missingMetadata", metadata.id);
          });
      }
      await Utils.sleep(metadata.fetchDelay);
    }
    PostMetadata.currentlyFetchingFromQueue = false;
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
    Utils.addStaticInitializer(() => {
      if (Utils.onFavoritesPage()) {
        window.addEventListener("favoritesLoaded", () => {
          PostMetadata.allFavoritesLoaded = true;
          PostMetadata.missingMetadataFetchQueue = PostMetadata.missingMetadataFetchQueue.concat(PostMetadata.deletedPostFetchQueue);
          PostMetadata.fetchAllMissingMetadata();
        }, {
          once: true
        });
      }
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
   * @type {String}
   */
  get apiURL() {
    return Utils.getPostAPIURL(this.id);
  }

  /**
   * @type {String}
   */
  get postURL() {
    return Utils.getPostPageURL(this.id);
  }

  /**
   * @type {Number}
   */
  get fetchDelay() {
    return this.postIsDeleted ? PostMetadata.fetchDelay.deleted : PostMetadata.fetchDelay.normal;
  }

  /**
   * @type {Boolean}
   */
  get isEmpty() {
    return this.width === 0 && this.height === 0;
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
    this.width = 0;
    this.height = 0;
    this.score = 0;
    this.creationTimestamp = 0;
    this.lastChangedTimestamp = 0;
    this.rating = 4;
    this.postIsDeleted = false;
    this.populateMetadata(record);
    this.addInstanceToAllMetadata();
  }

  /**
   * @param {Object.<String, String>} record
   */
  populateMetadata(record) {
    const databaseRecordHasNoMetadata = record === null;
    const databaseRecordDoesNotExist = record === undefined;

    if (databaseRecordDoesNotExist) {
      this.populateMetadataFromAPI();
      return;
    }

    if (databaseRecordHasNoMetadata) {
      this.addInstanceToMissingMetadataQueue();
      PostMetadata.fetchAllMissingMetadata();
      return;
    }
    this.populateMetadataFromRecord(JSON.parse(record));
    const databaseRecordHasEmptyMetadata = this.isEmpty;

    if (databaseRecordHasEmptyMetadata) {
      this.addInstanceToMissingMetadataQueue();
      PostMetadata.fetchAllMissingMetadata();
    }
  }

  populateMetadataFromAPI() {
    if (PostMetadata.pendingRequests.size > 200) {
      this.addInstanceToMissingMetadataQueue();
      return Utils.sleep(0);
    }
    PostMetadata.pendingRequests.add(this.id);
    return fetch(this.apiURL)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        PostMetadata.pendingRequests.delete(this.id);
        const dom = PostMetadata.parser.parseFromString(html, "text/html");
        const metadata = dom.querySelector("post");

        if (metadata === null) {
          // @ts-ignore
          throw new Error(`metadata is null - ${this.apiURL}`, {
            cause: "DeletedMetadata"
          });
        }
        this.width = parseInt(metadata.getAttribute("width") || "0");
        this.height = parseInt(metadata.getAttribute("height") || "0");
        this.score = parseInt(metadata.getAttribute("score") || "0");
        this.rating = PostMetadata.encodeRating(metadata.getAttribute("rating") || "0");
        this.creationTimestamp = Date.parse(metadata.getAttribute("created_at") || "0");
        this.lastChangedTimestamp = parseInt(metadata.getAttribute("change") || "0");
        Post.validateExtractedTagsAgainstAPI(this.id, metadata.getAttribute("tags") || "", metadata.getAttribute("file_url") || "");

        const extension = Utils.getExtensionFromImageURL(metadata.getAttribute("file_url") || "");

        if (extension !== "mp4") {
          Utils.assignImageExtension(this.id, extension);
        }
      })
      .catch((error) => {
        if (error.cause === "DeletedMetadata") {
          this.postIsDeleted = true;
          PostMetadata.deletedPostFetchQueue.push(this);
        } else if (error.message === "Failed to fetch") {
          PostMetadata.missingMetadataFetchQueue.push(this);
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
        const dom = PostMetadata.parser.parseFromString(html, "text/html");
        const statistics = dom.getElementById("stats");

        if (statistics === null || statistics.textContent === null) {
          return;
        }
        const textContent = Utils.replaceLineBreaks(statistics.textContent.trim(), " ");
        const match = PostMetadata.postStatisticsRegex.exec(textContent);

        PostMetadata.postStatisticsRegex.lastIndex = 0;

        if (!match) {
          return;
        }
        this.width = parseInt(match[2]);
        this.height = parseInt(match[3]);
        this.score = parseInt(match[5]);
        this.rating = PostMetadata.encodeRating(match[4]);
        this.creationTimestamp = Date.parse(match[1]);
        this.lastChangedTimestamp = this.creationTimestamp / 1000;

        if (PostMetadata.allFavoritesLoaded) {
          dispatchEvent(new CustomEvent("missingMetadata", {
            detail: this.id
          }));
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * @param {MetadataSearchExpression} expression
   * @returns {Boolean}
   */
  satisfiesExpression(expression) {
    const metricValue = this[expression.metric] || 0;
    const value = this[expression.value] || expression.value;
    return this.evaluateExpression(metricValue, expression.operator, value);
  }

  /**
   * @param {Number} metricValue
   * @param {String} operator
   * @param {Number} value
   * @returns {Boolean}
   */
  evaluateExpression(metricValue, operator, value) {
    let result = false;

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
    return result;
  }

  addInstanceToAllMetadata() {
    if (!PostMetadata.allMetadata.has(this.id)) {
      PostMetadata.allMetadata.set(this.id, this);
    }
  }

  addInstanceToMissingMetadataQueue() {
    PostMetadata.missingMetadataFetchQueue.push(this);
  }
}
