class InactivePost {
  /**
   * @param {String} compressedSource
   * @param {String} id
   * @returns {String}
   */
  static decompressThumbSource(compressedSource, id) {
    compressedSource = compressedSource.split("_");
    return `https://us.rule34.xxx/thumbnails//${compressedSource[0]}/thumbnail_${compressedSource[1]}.jpg?${id}`;
  }

  /**
   * @type {String}
   */
  id;
  /**
   * @type {String}
   */
  tags;
  /**
   * @type {String}
   */
  src;
  /**
   * @type {String}
   */
  metadata;
  /**
   * @type {Boolean}
   */
  fromRecord;
  /**
   * @type {Number}
   */
  rating;
  /**
   * @type {Number}
   */
  score;

  /**
   * @param {HTMLElement | Object} favorite
   */
  constructor(favorite, fromRecord) {
    this.fromRecord = fromRecord;

    if (fromRecord) {
      this.populateAttributesFromDatabaseRecord(favorite);
    } else {
      this.populateAttributesFromHTMLElement(favorite);
    }
  }

  /**
   * @param {{id: String, tags: String, src: String, metadata: String}} record
   */
  populateAttributesFromDatabaseRecord(record) {
    this.id = record.id;
    this.tags = record.tags;
    this.src = InactivePost.decompressThumbSource(record.src, record.id);
    this.metadata = record.metadata;
  }

  /**
   * @param {HTMLElement} element
   */
  populateAttributesFromHTMLElement(element) {
    this.id = Utils.getIdFromThumb(element);
    const image = Utils.getImageFromThumb(element);

    this.src = image.src;
    this.tags = this.preprocessTags(image);
  }

  /**
   * @param {HTMLImageElement} image
   * @returns {String}
   */
  preprocessTags(image) {
    const tags = Utils.correctMisspelledTags(image.title || image.getAttribute("tags"));
    return Utils.removeExtraWhiteSpace(tags).split(" ").sort().join(" ");
  }

  instantiateMetadata() {
    if (this.fromRecord) {
      return new PostMetadata(this.id, this.metadata);
    }
    const favoritesMetadata = new PostMetadata(this.id);
    return favoritesMetadata;
  }

  clear() {
    this.id = null;
    this.tags = null;
    this.src = null;
    this.metadata = null;
    this.rating = null;
    this.score = null;
  }
}

class Post {
  /**
   * @type {Map.<String, Post>}
   */
  static allPosts = new Map();
  /**
   * @type {RegExp}
   */
  static thumbSourceCompressionRegex = /thumbnails\/\/([0-9]+)\/thumbnail_([0-9a-f]+)/;
  /**
   * @type {HTMLElement}
   */
  static template;
  /**
   * @type {String}
   */
  static removeFavoriteButtonHTML;
  /**
   * @type {String}
   */
  static addFavoriteButtonHTML;
  static currentSortingMethod = Utils.getPreference("sortingMethod", "default");
  static settings = {
    deferHTMLElementCreation: true
  };

  static {
    Utils.addStaticInitializer(() => {
      if (Utils.onFavoritesPage()) {
        Post.createTemplates();
        Post.addEventListeners();
      }
    });
  }

  static createTemplates() {
    Post.removeFavoriteButtonHTML = `<button class="remove-favorite-button add-or-remove-button"><img src=${Utils.createObjectURLFromSvg(Utils.icons.heartMinus)}></button>`;
    Post.addFavoriteButtonHTML = `<button class="add-favorite-button add-or-remove-button"><img src=${Utils.createObjectURLFromSvg(Utils.icons.heartPlus)}></button>`;
    const buttonHTML = Utils.userIsOnTheirOwnFavoritesPage() ? Post.removeFavoriteButtonHTML : Post.addFavoriteButtonHTML;
    const canvasHTML = Utils.getPerformanceProfile() > 0 ? "" : "<canvas></canvas>";

    Post.template = new DOMParser().parseFromString("", "text/html").createElement("div");
    Post.template.className = Utils.favoriteItemClassName;
    Post.template.innerHTML = `
        <div>
          <img loading="lazy">
          ${buttonHTML}
          ${canvasHTML}
        </div>
    `;
  }

  static addEventListeners() {
    window.addEventListener("favoriteAddedOrDeleted", (event) => {
      const id = event.detail;
      const post = this.allPosts.get(id);

      if (post !== undefined) {
        post.swapAddOrRemoveButton();
      }
    });
    window.addEventListener("sortingParametersChanged", () => {
      Post.currentSortingMethod = Utils.getSortingMethod();
      const posts = Utils.getAllThumbs().map(thumb => Post.allPosts.get(thumb.id));

      for (const post of posts) {
        post.createStatisticHint();
      }
    });
  }

  /**
   * @param {String} id
   * @returns {Number}
   */
  static getPixelCount(id) {
    const post = Post.allPosts.get(id);

    if (post === undefined || post.metadata === undefined) {
      return 0;
    }
    return post.metadata.pixelCount;
  }

  /**
   * @param {String} id
   * @returns {String}
   */
  static getExtensionFromPost(id) {
    const post = Post.allPosts.get(id);

    if (post === undefined) {
      return undefined;
    }

    if (post.metadata.isEmpty()) {
      return undefined;
    }
    return post.metadata.extension;
  }

  /**
   * @param {String} id
   * @param {String} apiTags
   * @param {String} fileURL
   */
  static verifyTags(id, apiTags, fileURL) {
    const post = Post.allPosts.get(id);

    if (post === undefined) {
      return;
    }
    const postTagSet = new Set(post.originalTagSet);
    const apiTagSet = Utils.convertToTagSet(apiTags);

    if (fileURL.endsWith("mp4")) {
      apiTagSet.add("video");
    } else if (fileURL.endsWith("gif")) {
      apiTagSet.add("gif");
    }

    postTagSet.delete(id);
    const tagsNotInPost = Utils.difference(apiTagSet, postTagSet);
    const tagsNotInApi = Utils.difference(postTagSet, apiTagSet);

    if (tagsNotInApi.size === 0 && tagsNotInPost.size === 0) {
      return;
    }
    post.initializeTags(Utils.convertToTagString(apiTagSet));
  }

  /**
   * @type {Map.<String, Post>}
   */
  static get postsMatchedBySearch() {
    const posts = new Map();

    for (const [id, post] of Post.allPosts.entries()) {
      if (post.matchedByMostRecentSearch) {
        posts.set(id, post);
      }
    }
    return posts;
  }

  /**
   * @type {String}
   */
  id;
  /**
   * @type {HTMLDivElement}
   */
  root;
  /**
   * @type {HTMLElement}
   */
  container;
  /**
   * @type {HTMLImageElement}
   */
  image;
  /**
   * @type {HTMLButtonElement}
   */
  addOrRemoveButton;
  /**
   * @type {HTMLDivElement}
   */
  statisticHint;
  /**
   * @type {InactivePost}
   */
  inactivePost;
  /**
   * @type {Boolean}
   */
  essentialAttributesPopulated;
  /**
   * @type {Boolean}
   */
  htmlElementCreated;
  /**
   * @type {Set.<String>}
   */
  tagSet;
  /**
   * @type {Set.<String>}
   */
  additionalTags;
  /**
   * @type {Number}
   */
  originalTagsLength;
  /**
   * @type {Boolean}
   */
  matchedByMostRecentSearch;
  /**
   * @type {PostMetadata}
   */
  metadata;

  /**
   * @type {String}
   */
  get href() {
    return Utils.getPostPageURLFromPostId(this.id);
  }

  /**
   * @type {String}
   */
  get compressedThumbSource() {
    const source = this.inactivePost === null ? this.image.src : this.inactivePost.src;
    return source.match(Post.thumbSourceCompressionRegex).splice(1).join("_");
  }

  /**
   * @type {{id: String, tags: String, src: String, metadata: String}}
   */
  get databaseRecord() {
    return {
      id: this.id,
      tags: this.originalTagsString,
      src: this.compressedThumbSource,
      metadata: this.metadata.json
    };
  }

  /**
   * @type {Set.<String>}
   */
  get originalTagSet() {
    const originalTags = new Set();
    let count = 0;

    for (const tag of this.tagSet.values()) {
      if (count >= this.originalTagsLength) {
        break;
      }
      count += 1;
      originalTags.add(tag);
    }
    return originalTags;
  }

  /**
   * @type {Set.<String>}
   */
  get originalTagsString() {
    return Utils.convertToTagString(this.originalTagSet);
  }

  /**
   * @type {String}
   */
  get additionalTagsString() {
    return Utils.convertToTagString(this.additionalTags);
  }

  /**
   * @param {HTMLElement | Object} thumb
   * @param {Boolean} fromRecord
   */
  constructor(thumb, fromRecord) {
    this.initializeFields();
    this.initialize(new InactivePost(thumb, fromRecord));
    this.setMatched(true);
    this.addInstanceToAllPosts();
  }

  initializeFields() {
    this.inactivePost = null;
    this.essentialAttributesPopulated = false;
    this.htmlElementCreated = false;
  }

  /**
   * @param {InactivePost} inactivePost
   */
  initialize(inactivePost) {
    if (Post.settings.deferHTMLElementCreation) {
      this.inactivePost = inactivePost;
      this.populateEssentialAttributes(inactivePost);
    } else {
      this.createHTMLElement(inactivePost);
    }
  }

  /**
   * @param {InactivePost} inactivePost
   */
  populateEssentialAttributes(inactivePost) {
    if (this.essentialAttributesPopulated) {
      return;
    }
    this.essentialAttributesPopulated = true;
    this.id = inactivePost.id;
    this.metadata = inactivePost.instantiateMetadata();
    this.initializeTags(inactivePost.tags);
    this.deleteConsumedProperties(inactivePost);
  }

  /**
   * @param {InactivePost} inactivePost
   */
  createHTMLElement(inactivePost) {
    if (this.htmlElementCreated) {
      return;
    }
    this.htmlElementCreated = true;
    this.instantiateTemplate();
    this.populateEssentialAttributes(inactivePost);
    this.populateHTMLAttributes(inactivePost);
    this.setupAddOrRemoveButton();
    this.setupClickLink();
    this.deleteInactivePost();
  }

  activateHTMLElement() {
    if (this.inactivePost !== null) {
      this.createHTMLElement(this.inactivePost);
    }
  }

  instantiateTemplate() {
    this.root = Post.template.cloneNode(true);
    this.container = this.root.children[0];
    this.image = this.root.children[0].children[0];
    this.addOrRemoveButton = this.root.children[0].children[1];
  }

  setupAddOrRemoveButton() {
    if (Utils.userIsOnTheirOwnFavoritesPage()) {
      this.addOrRemoveButton.onclick = this.removeFavoriteButtonOnClick.bind(this);
    } else {
      this.addOrRemoveButton.onclick = this.addFavoriteButtonOnClick.bind(this);
    }
  }

  /**
   * @param {MouseEvent} event
   */
  removeFavoriteButtonOnClick(event) {
    event.stopPropagation();
    Utils.removeFavorite(this.id);
    this.swapAddOrRemoveButton();
  }

  /**
   * @param {MouseEvent} event
   */
  addFavoriteButtonOnClick(event) {
    event.stopPropagation();
    Utils.addFavorite(this.id);

    this.swapAddOrRemoveButton();
  }

  swapAddOrRemoveButton() {
    const isRemoveFavoriteButton = this.addOrRemoveButton.classList.contains("remove-favorite-button");

    if (isRemoveFavoriteButton) {
      this.addOrRemoveButton.outerHTML = Post.addFavoriteButtonHTML;
      this.addOrRemoveButton = this.root.children[0].children[1];
      this.addOrRemoveButton.onclick = this.addFavoriteButtonOnClick.bind(this);
    } else {
      this.addOrRemoveButton.outerHTML = Post.removeFavoriteButtonHTML;
      this.addOrRemoveButton = this.root.children[0].children[1];
      this.addOrRemoveButton.onclick = this.removeFavoriteButtonOnClick.bind(this);
    }
  }

  /**
   * @param {InactivePost} inactivePost
   */
  populateHTMLAttributes(inactivePost) {
    this.image.src = inactivePost.src;
    this.image.classList.add(Utils.getContentType(inactivePost.tags || Utils.convertToTagString(this.tagSet)));
    this.root.id = inactivePost.id;
  }

  /**
   * @param {String} tags
   */
  initializeTags(tags) {
    this.tagSet = Utils.convertToTagSet(`${this.id} ${tags}`);
    this.originalTagsLength = this.tagSet.size;
    this.initializeAdditionalTags();
  }

  initializeAdditionalTags() {
    this.additionalTags = Utils.convertToTagSet(TagModifier.tagModifications.get(this.id) || "");

    if (this.additionalTags.size !== 0) {
      this.combineOriginalAndAdditionalTags();
    }
  }

  /**
   * @param {InactivePost} inactivePost
   */
  deleteConsumedProperties(inactivePost) {
    inactivePost.metadata = null;
    inactivePost.tags = null;
  }

  setupClickLink() {
    if (!Utils.onFavoritesPage()) {
      return;
    }
    this.container.onmousedown = (event) => {
      const middleClick = event.button === Utils.clickCodes.middle;
      const leftClick = event.button === Utils.clickCodes.left;

      if (middleClick || (leftClick && !Utils.galleryEnabled())) {
        Utils.openPostInNewPage(this.id);
      }
    };
  }

  deleteInactivePost() {
    if (this.inactivePost !== null) {
      this.inactivePost.clear();
      this.inactivePost = null;
    }
  }

  /**
   * @param {HTMLElement} content
   */
  insertAtEndOfContent(content) {
    if (this.inactivePost !== null) {
      this.createHTMLElement(this.inactivePost, true);
    }
    this.createStatisticHint();
    content.appendChild(this.root);
  }

  /**
   * @param {HTMLElement} content
   */
  insertAtBeginningOfContent(content) {
    if (this.inactivePost !== null) {
      this.createHTMLElement(this.inactivePost, true);
    }
    this.createStatisticHint();
    content.insertAdjacentElement("afterbegin", this.root);
  }

  addInstanceToAllPosts() {
    if (!Post.allPosts.has(this.id)) {
      Post.allPosts.set(this.id, this);
    }
  }

  toggleMatched() {
    this.matchedByMostRecentSearch = !this.matchedByMostRecentSearch;
  }

  /**
   * @param {Boolean} value
   */
  setMatched(value) {
    this.matchedByMostRecentSearch = value;
  }

  combineOriginalAndAdditionalTags() {
    this.tagSet = this.originalTagSet;
    this.tagSet = Utils.union(this.tagSet, this.additionalTags);
  }

  /**
   * @param {String} newTags
   * @returns {String}
   */
  addAdditionalTags(newTags) {
    const newTagsSet = Utils.convertToTagSet(newTags);

    if (newTagsSet.size > 0) {
      this.additionalTags = Utils.union(this.additionalTags, newTagsSet);
      this.combineOriginalAndAdditionalTags();
    }
    return this.additionalTagsString;
  }

  /**
   * @param {String} tagsToRemove
   * @returns {String}
   */
  removeAdditionalTags(tagsToRemove) {
    const tagsToRemoveSet = Utils.convertToTagSet(tagsToRemove);

    if (tagsToRemoveSet.size > 0) {
      this.additionalTags = Utils.difference(this.additionalTags, tagsToRemoveSet);
      this.combineOriginalAndAdditionalTags();
    }
    return this.additionalTagsString;
  }

  resetAdditionalTags() {
    if (this.additionalTags.size === 0) {
      return;
    }
    this.additionalTags = new Set();
    this.combineOriginalAndAdditionalTags();
  }

  /**
   * @returns {HTMLDivElement}
   */
  getStatisticHint() {
    return this.container.querySelector(".statistic-hint");
  }

  /**
   * @returns {Boolean}
   */
  hasStatisticHint() {
    return this.getStatisticHint() !== null;
  }

  /**
   * @returns {String}
   */
  getStatisticValue() {
    switch (Post.currentSortingMethod) {
      case "score":
        return this.metadata.score;

      case "width":
        return this.metadata.width;

      case "height":
        return this.metadata.height;

      case "create":
        return Utils.convertTimestampToDate(this.metadata.creationTimestamp);

      case "change":
        return Utils.convertTimestampToDate(this.metadata.lastChangedTimestamp * 1000);

      default:
        return this.id;
    }
  }

  async createStatisticHint() {
    // await sleep(200);
    // let hint = this.getStatisticHint();

    // if (hint === null) {
    //   hint = document.createElement("div");
    //   hint.className = "statistic-hint";
    //   this.container.appendChild(hint);
    // }
    // hint.textContent = this.getStatisticValue();
  }
}
