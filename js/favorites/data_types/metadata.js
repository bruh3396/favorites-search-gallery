class PostMetadata {
  /** @type {Set<String>} */
  static pendingRequests = new Set();

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

  /** @type {Boolean} */
  static get tooManyPendingRequests() {
    return PostMetadata.pendingRequests.size > 200;
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
    this.populate(record);
  }

  /**
   * @param {FavoritesDatabaseMetadataRecord | undefined | null} record
   */
  async populate(record) {
    const recordHasNoMetadata = record === null;
    const recordDoesNotExist = record === undefined;
    const recordIsValid = !recordHasNoMetadata && !recordDoesNotExist;

    if (recordIsValid) {
      this.populateMetadataFromRecord(record);
      return;
    }
    const apiPost = await this.fetchPost();

    Extensions.set(this.id, apiPost.extension);
    this.populateMetadataFromAPIPost(apiPost);
    Post.validateExtractedTagsAgainstAPI(this.id, apiPost.tags, apiPost.fileURL);

    if (recordHasNoMetadata) {
      Events.favorites.foundMissingMetadata.emit(this.id);
    }
  }

  /**
   * @returns {Promise<APIPost>}
   */
  async fetchPost() {
    if (PostMetadata.tooManyPendingRequests) {
      await FetchQueues.postMetadata.wait();
    }
    PostMetadata.pendingRequests.add(this.id);
    let apiPost = await APIPost.fetch(this.id);

    if (apiPost.isEmpty) {
      this.postIsDeleted = true;
      apiPost = await PostPage.fetchAPIPost(this.id);
    }
    PostMetadata.pendingRequests.delete(this.id);
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
