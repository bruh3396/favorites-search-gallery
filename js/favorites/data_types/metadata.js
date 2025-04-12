class PostMetadata {
  /**
   * @type {{
   *   NO_FAVORITE_RECORD: 0,
   *   HAS_FAVORITE_RECORD: 1,
   *   HAS_METADATA_RECORD: 2
   * }}
   */
  static statuses = {
    NO_FAVORITE_RECORD: 0,
    HAS_FAVORITE_RECORD: 1,
    HAS_METADATA_RECORD: 2
  };
  /** @type {FavoritesDatabaseMetadataRecord} */
  static emptyRecord = {
    width: 0,
    height: 0,
    score: 0,
    rating: 4,
    create: 0,
    change: 0,
    deleted: false
  };

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
  /** @type {Set<String>} */
  static pendingRequests = new Set();
  /** @type {PostMetadata[]} */
  static updateQueue = [];

  /** @type {Boolean} */
  static get tooManyPendingRequests() {
    return PostMetadata.pendingRequests.size > 250;
  }

  static {
    Utils.addStaticInitializer(PostMetadata.initialize);
  }

  static initialize() {
    FetchQueues.postMetadata.pause();
    Events.favorites.favoritesLoaded.on(() => {
      FetchQueues.postMetadata.resume();
      PostMetadata.fetchMissingMetadata();
    }, {
      once: true
    });
  }

  static async fetchMissingMetadata() {
    for (const metadata of PostMetadata.updateQueue) {
      await FetchQueues.postMetadata.wait();
      metadata.populateHelper();
    }
  }

  /** @type {String} */
  id;
  /** @type {Number} */
  numericId;
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
   * @param {FavoritesDatabaseMetadataRecord} record
   * @param {PostMetadataStatus} status
   */
  constructor(id, record, status) {
    this.id = id;
    this.numericId = parseInt(id);
    this.width = 0;
    this.height = 0;
    this.score = 0;
    this.creationTimestamp = 0;
    this.lastChangedTimestamp = 0;
    this.rating = 4;
    this.postIsDeleted = false;
    this.populate(record, status);
  }

  /**
   * @param {FavoritesDatabaseMetadataRecord} record
   * @param {PostMetadataStatus} status
   */
  async populate(record, status) {
    if (status === PostMetadata.statuses.NO_FAVORITE_RECORD) {
      this.populateHelper();
      return;
    }

    if (status === PostMetadata.statuses.HAS_FAVORITE_RECORD) {
      await FetchQueues.postMetadata.wait();
      await this.populateHelper();
      Events.favorites.missingMetadataFound.emit(this.id);
      return;
    }
    this.populateMetadataFromRecord(record);

    if (this.isEmpty) {
      await FetchQueues.postMetadata.wait();
      await this.populateHelper();
      Events.favorites.missingMetadataFound.emit(this.id);
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async populateHelper() {
    if (PostMetadata.tooManyPendingRequests) {
      PostMetadata.updateQueue.push(this);
      return;
    }
    PostMetadata.pendingRequests.add(this.id);
    const apiPost = await this.fetchPost();

    Extensions.set(this.id, apiPost.extension);
    this.populateMetadataFromAPIPost(apiPost);
    Post.validateExtractedTagsAgainstAPI(apiPost);
  }

  /**
   * @returns {Promise<APIPost>}
   */
  async fetchPost() {
    const apiPost = await APIPost.fetch(this.id);

    PostMetadata.pendingRequests.delete(this.id);

    if (apiPost.isEmpty) {
      this.postIsDeleted = true;
      return PostPage.fetchAPIPost(this.id);
    }
    return apiPost;
  }

  /**
   * @param {APIPost} apiPost
   */
  populateMetadataFromAPIPost(apiPost) {
    this.width = apiPost.width;
    this.height = apiPost.height;
    this.score = apiPost.score;
    this.rating = PostMetadata.encodeRating(apiPost.rating);
    this.creationTimestamp = Date.parse(apiPost.createdAt);
    this.lastChangedTimestamp = apiPost.change;
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
    switch (operator) {
      case ":":
        return metricValue === value;

      case ":<":
        return metricValue < value;

      case ":>":
        return metricValue > value;

      default:
        return false;
    }
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
        return this.numericId;

      default:
        return 0;
    }
  }
}
