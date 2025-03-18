class PostMetadata {
  /** @type {Map<String, PostMetadata>} */
  static allMetadata = new Map();
  /** @type {Set<String>} */
  static pendingRequests = new Set();
  static parser = new DOMParser();
  /** @type {PostMetadata[]} */
  static missingMetadataFetchQueue = [];
  /** @type {PostMetadata[]} */
  static deletedPostFetchQueue = [];
  static currentlyFetchingFromQueue = false;
  static allFavoritesLoaded = false;
  static fetchDelay = {
    normal: 2,
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
        metadata.fetchMetadataFromAPI()
          .then(() => {
            Events.favorites.missingMetadata.emit(metadata.id);
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
      if (Flags.onFavoritesPage) {
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
  /** @type {String} */
  id;
  /** @type {Number} */
  width;
  /** @type {Number} */
  height;
  /** @type {Number} */
  score;
  /** @type {Number} */
  rating;
  /** @type {Number} */
  creationTimestamp;
  /** @type {Number} */
  lastChangedTimestamp;
  /** @type {Boolean} */
  postIsDeleted;

  /** @type {String} */
  get postURL() {
    return Utils.getPostPageURL(this.id);
  }

  /** @type {Number} */
  get fetchDelay() {
    return this.postIsDeleted ? PostMetadata.fetchDelay.deleted : PostMetadata.fetchDelay.normal;
  }

  /** @type {Boolean} */
  get isEmpty() {
    return this.width === 0 && this.height === 0;
  }

  /** @type {String} */
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

  /** @type {Number} */
  get pixelCount() {
    return this.width * this.height;
  }

  /**
   * @param {String} id
   * @param {FavoritesDatabaseMetadataRecord | undefined | null} record
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
   * @param {FavoritesDatabaseMetadataRecord | undefined | null} record
   */
  populateMetadata(record) {
    const databaseRecordHasNoMetadata = record === null;
    const databaseRecordDoesNotExist = record === undefined;

    if (databaseRecordDoesNotExist) {
      this.fetchMetadataFromAPI();
      return;
    }

    if (databaseRecordHasNoMetadata) {
      this.addInstanceToMissingMetadataQueue();
      PostMetadata.fetchAllMissingMetadata();
      return;
    }
    this.populateMetadataFromRecord(record);
    const databaseRecordHasEmptyMetadata = this.isEmpty;

    if (databaseRecordHasEmptyMetadata) {
      this.addInstanceToMissingMetadataQueue();
      PostMetadata.fetchAllMissingMetadata();
    }
  }

  fetchMetadataFromAPI() {
    if (PostMetadata.pendingRequests.size > 200) {
      this.addInstanceToMissingMetadataQueue();
      return Utils.sleep(0);
    }
    PostMetadata.pendingRequests.add(this.id);
    return new APIPost(this.id).fetch()
      .then((apiPost) => {
        PostMetadata.pendingRequests.delete(this.id);
        this.checkIfEmpty(apiPost);
        this.populateMetadataFromAPI(apiPost);
        Extensions.set(this.id, apiPost.extension);
      }).catch((error) => {
        this.handleAPIFailure(error);
      });
  }

  /**
   * @param {APIPost} apiPost
   */
  checkIfEmpty(apiPost) {
    if (apiPost.isEmpty) {
      // @ts-ignore
      throw new Error(`metadata is null - ${apiPost.url}`, {
        cause: "DeletedMetadata"
      });
    }
  }

  /**
   * @param {APIPost} apiPost
   */
  populateMetadataFromAPI(apiPost) {
    this.width = apiPost.width;
    this.height = apiPost.height;
    this.score = apiPost.score;
    this.rating = PostMetadata.encodeRating(apiPost.rating);
    this.creationTimestamp = Date.parse(apiPost.createdAt);
    this.lastChangedTimestamp = apiPost.change;
    Post.validateExtractedTagsAgainstAPI(this.id, apiPost.tags, apiPost.fileURL);
  }

  /**
   * @param {any} error
   */
  handleAPIFailure(error) {
    if (error.cause === "DeletedMetadata") {
      this.postIsDeleted = true;
      PostMetadata.deletedPostFetchQueue.push(this);
    } else if (error.message === "Failed to fetch") {
      PostMetadata.missingMetadataFetchQueue.push(this);
    } else {
      console.error(error);
    }
  }

/**
 * @param {FavoritesDatabaseMetadataRecord} record
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
    const metricValue = this.getMetric(expression.metric);
    const value = expression.hasRelativeValue ? this.getMetric(expression.relativeValue) : expression.numericValue;
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

  /**
   * @param {MetadataMetric} metric
   * @returns {Number}
   */
  getMetric(metric) {
    switch (metric) {
      case "score":
        return this.score;

      case "width":
        return this.width;

      case "height":
        return this.height;

      case "lastChangedTimestamp":
        return this.lastChangedTimestamp;

      case "creationTimestamp":
        return this.creationTimestamp;

      case "id":
        return Number(this.id);

      default:
        return 0;
    }
  }
}
