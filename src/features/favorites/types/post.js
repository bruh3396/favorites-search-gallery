class Post {
  /** @type {Map<String, Post>} */
  static allPosts = new Map();

  static {
    Utils.addStaticInitializer(() => {
      if (Flags.onFavoritesPage) {
        Post.addEventListeners();
      }
    });
  }

  static addEventListeners() {
    Events.gallery.favoriteAddedOrDeleted.on((id) => {
      const post = Post.get(id);

      if (post !== undefined) {
        post.htmlElement.swapAddOrRemoveButton();
      }
    });
  }

  /**
   * @param {String} id
   * @returns {Post | undefined}
   */
  static get(id) {
    return Post.allPosts.get(id);
  }

  /**
   * @returns {Post[]}
   */
  static all() {
    return Array.from(Post.allPosts.values());
  }

  /**
   * @param {String} id
   * @returns {Number}
   */
  static getPixelCount(id) {
    const post = Post.get(id);

    if (post === undefined || post.metadata === undefined) {
      return 0;
    }
    return post.metadata.pixelCount;
  }

  /**
   * @param {APIPost} apiPost
   */
  static validateExtractedTagsAgainstAPI(apiPost) {
    const post = Post.get(apiPost.id);

    if (post !== undefined) {
      post.validateTagsAgainstAPI(apiPost);
    }
  }

  /** @type {String} */
  id;
  /** @type {PostData} */
  tempData;
  /** @type {PostMetadata} */
  metadata;
  /** @type {PostHTMLElement} */
  htmlElement;
  /** @type {PostTags} */
  tags;
  /** @type {Set<String>} */
  additionalTagSet;

  /** @type {String} */
  get compressedThumbSource() {
    return ImageUtils.compressThumbSource(this.thumbURL);
  }

  /** @type {FavoritesDatabaseRecord} */
  get databaseRecord() {
    return {
      id: this.id,
      tags: this.tags.originalTagString,
      src: this.compressedThumbSource,
      metadata: this.metadata.json
    };
  }

  /** @type {String} */
  get thumbURL() {
    return this.tempData.cleared ? this.htmlElement.thumbURL : this.tempData.src;
  }

  /** @type {HTMLElement} */
  get root() {
    return this.htmlElement.root;
  }

  /** @type {Set<String>} */
  get tagSet() {
    return this.tags.tagSet;
  }

  /**
   * @param {HTMLElement | FavoritesDatabaseRecord} object
   */
  constructor(object) {
    this.tempData = new PostData(object);
    this.htmlElement = new PostHTMLElement();
    this.tags = new PostTags(this.tempData);
    this.id = this.tempData.id;
    this.metadata = this.tempData.createMetadata();
    this.tempData.clearSearchProperties();
    this.addInstanceToAllPosts();
  }

  activateHTMLElement() {
    if (!this.tempData.cleared) {
      this.htmlElement.initialize(this.tempData, this.metadata);
      this.tempData.clear();
    }
  }

  addInstanceToAllPosts() {
    if (!Post.allPosts.has(this.id)) {
      Post.allPosts.set(this.id, this);
    }
  }

  /**
   * @param {Rating} rating
   * @returns {Boolean}
   */
  withinRating(rating) {
    // eslint-disable-next-line no-bitwise
    return (this.metadata.rating & rating) > 0;
  }

  /**
   * @returns {Promise<DownloadRequest>}
   */
  async getDownloadRequest() {
    const thumbURL = this.thumbURL;
    const isVideo = !Constants.videoTagSet.isDisjointFrom(this.tagSet);
    const isGif = !isVideo && !Constants.animatedTagSet.isDisjointFrom(this.tagSet);
    let extension;

    if (isVideo) {
      extension = "mp4";
    } else if (isGif) {
      extension = "gif";
    } else {
      extension = await ImageUtils.getImageExtensionFromId(this.id);
    }
    const url = ImageUtils.getOriginalImageURLFromIdAndThumbURL(this.id, thumbURL).replace(".jpg", `.${extension}`);
    return new DownloadRequest(this.id, url, extension);
  }

  /**
   * @param {APIPost} apiPost
   */
  validateTagsAgainstAPI(apiPost) {
    const postTagSet = new Set(this.tags.originalTagSet);
    const apiTagSet = Utils.convertToTagSet(apiPost.tags);

    if (apiPost.fileURL.endsWith("mp4")) {
      apiTagSet.add("video");
    } else if (apiPost.fileURL.endsWith("gif")) {
      apiTagSet.add("gif");
    } else if (!apiTagSet.has("animated_png")) {
      apiTagSet.delete("video");
      apiTagSet.delete("animated");
    }
    postTagSet.delete(this.id);

    if (apiTagSet.symmetricDifference(postTagSet).size > 0) {
      this.tags.initializeTagSets(Utils.convertToTagString(apiTagSet));
    }
  }
}
