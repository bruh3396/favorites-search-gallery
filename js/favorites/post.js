class Post {
  /**
   * @type {Map.<String, Post>}
   */
  static allPosts = new Map();
  /**
   * @type {RegExp}
   */
  static thumbnailSourceCompressionRegex = /thumbnails\/\/([0-9]+)\/thumbnail_([0-9a-f]+)/;
  /**
   * @type {HTMLElement}
   */
  static htmlTemplate;
  /**
   * @type {String}
   */
  static removeFavoriteButtonHTML;
  /**
   * @type {String}
   */
  static addFavoriteButtonHTML;

  static {
    Utils.addStaticInitializer(() => {
      if (Utils.onFavoritesPage()) {
        Post.createTemplates();
        Post.addEventListeners();
      }
    });
  }

  static createTemplates() {
    Post.removeFavoriteButtonHTML = `<img class="remove-favorite-button add-or-remove-button" src=${Utils.createObjectURLFromSvg(Utils.icons.heartMinus)}>`;
    Post.addFavoriteButtonHTML = `<img class="add-favorite-button add-or-remove-button" src=${Utils.createObjectURLFromSvg(Utils.icons.heartPlus)}>`;
    const buttonHTML = Utils.userIsOnTheirOwnFavoritesPage() ? Post.removeFavoriteButtonHTML : Post.addFavoriteButtonHTML;
    const canvasHTML = Utils.getPerformanceProfile() > 0 ? "" : "<canvas></canvas>";
    const containerTagName = "a";

    Post.htmlTemplate = new DOMParser().parseFromString("", "text/html").createElement("div");
    Post.htmlTemplate.className = Utils.favoriteItemClassName;
    Post.htmlTemplate.innerHTML = `
        <${containerTagName}>
          <img>
          ${buttonHTML}
          ${canvasHTML}
        </${containerTagName}>
    `;
  }

  static addEventListeners() {
    window.addEventListener("favoriteAddedOrDeleted", (event) => {
      const id = event.detail;
      const post = Post.allPosts.get(id);

      if (post !== undefined) {
        post.swapAddOrRemoveButton();
      }
    });
    window.addEventListener("sortingParametersChanged", () => {
      const posts = Utils.getAllThumbs().map(thumb => Post.allPosts.get(thumb.id));

      for (const post of posts) {
        post.createMetadataHint();
      }
    });
    window.addEventListener("favoritesLoaded", () => {
      Post.enumerateAllPosts();
    }, {
      once: true
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
   * @param {String} apiTags
   * @param {String} fileURL
   */
  static correctTags(id, apiTags, fileURL) {
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
    } else if (!apiTagSet.has("animated_png")) {
      if (apiTagSet.has("video")) {
        apiTagSet.delete("video");
      }

      if (apiTagSet.has("animated")) {
        apiTagSet.delete("animated");
      }
    }
    postTagSet.delete(id);

    if (Utils.symmetricDifference(apiTagSet, postTagSet).size > 0) {
      post.initializeTagSet(Utils.convertToTagString(apiTagSet));
    }
  }

  static enumerateAllPosts() {
    const allPosts = Array.from(Post.allPosts.values()).reverse();
    let i = 1;

    for (const post of allPosts) {
      post.index = i;
      i += 1;
    }
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
   * @type {HTMLAnchorElement}
   */
  container;
  /**
   * @type {HTMLImageElement}
   */
  image;
  /**
   * @type {HTMLImageElement}
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
   * @type {PostMetadata}
   */
  metadata;
  /**
   * @type {Set.<String>}
   */
  tagSet;
  /**
   * @type {Set.<String>}
   */
  additionalTagSet;
  /**
   * @type {Number}
   */
  index;
  /**
   * @type {Boolean}
   */
  essentialAttributesArePopulated;
  /**
   * @type {Boolean}
   */
  htmlElementCreated;
  /**
   * @type {Boolean}
   */
  matchedByLatestSearch;

  /**
   * @type {String}
   */
  get compressedThumbSource() {
    const source = this.inactivePost === null ? this.image.src : this.inactivePost.src;
    return source.match(Post.thumbnailSourceCompressionRegex).splice(1).join("_");
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
    return Utils.difference(this.tagSet, this.additionalTagSet);
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
    return Utils.convertToTagString(this.additionalTagSet);
  }

  /**
   * @param {HTMLElement | Object} thumb
   * @param {Boolean} fromRecord
   */
  constructor(thumb, fromRecord) {
    this.initializeFields();
    this.inactivePost = new InactivePost(thumb, fromRecord);
    this.populateEssentialAttributes();
    this.setMatched(true);
    this.addInstanceToAllPosts();
  }

  initializeFields() {
    this.inactivePost = null;
    this.index = 0;
    this.essentialAttributesArePopulated = false;
    this.htmlElementCreated = false;
  }

  populateEssentialAttributes() {
    if (this.essentialAttributesArePopulated) {
      return;
    }
    this.essentialAttributesArePopulated = true;
    this.id = this.inactivePost.id;
    this.metadata = this.inactivePost.instantiateMetadata();
    this.initializeTagSet(this.inactivePost.tags);
    this.deleteConsumedPropertiesFromInactivePost();
  }

  createHTMLElement() {
    if (this.htmlElementCreated) {
      return;
    }
    this.htmlElementCreated = true;
    this.instantiateTemplate();
    this.populateEssentialAttributes();
    this.populateHTMLAttributes();
    this.setupAddOrRemoveButton(Utils.userIsOnTheirOwnFavoritesPage());
    this.setupClickLink();
    this.deleteInactivePost();
  }

  activateHTMLElement() {
    if (this.inactivePost !== null) {
      this.createHTMLElement(this.inactivePost);
    }
  }

  instantiateTemplate() {
    this.root = Post.htmlTemplate.cloneNode(true);
    this.container = this.root.children[0];
    this.image = this.root.children[0].children[0];
    this.addOrRemoveButton = this.root.children[0].children[1];
  }

  /**
   * @param {Boolean} isRemoveButton
   */
  setupAddOrRemoveButton(isRemoveButton) {
    if (isRemoveButton) {
      this.addOrRemoveButton.onmousedown = (event) => {
        event.stopPropagation();

        if (event.button === Utils.clickCodes.left) {
          this.removeFavorite();
        }
      };
    } else {
      this.addOrRemoveButton.onmousedown = (event) => {
        event.stopPropagation();

        if (event.button === Utils.clickCodes.left) {
          this.addFavorite();
        }
      };
    }
  }

  removeFavorite() {
    Utils.removeFavorite(this.id);
    this.swapAddOrRemoveButton();
  }

  addFavorite() {
    Utils.addFavorite(this.id);
    this.swapAddOrRemoveButton();
  }

  swapAddOrRemoveButton() {
    const isRemoveButton = this.addOrRemoveButton.classList.contains("remove-favorite-button");

    this.addOrRemoveButton.outerHTML = isRemoveButton ? Post.addFavoriteButtonHTML : Post.removeFavoriteButtonHTML;
    this.addOrRemoveButton = this.root.children[0].children[1];
    this.setupAddOrRemoveButton(!isRemoveButton);
  }

  populateHTMLAttributes() {
    this.image.src = this.inactivePost.src;
    this.image.classList.add(Utils.getContentType(this.inactivePost.tags || Utils.convertToTagString(this.tagSet)));
    this.root.id = this.inactivePost.id;

    if (!Utils.onMobileDevice()) {
      Utils.getOriginalImageURLWithExtension(this.root)
        .then((url) => {
          this.container.href = url;
        });
    }
  }

  /**
   * @param {String} tags
   */
  initializeTagSet(tags) {
    this.tagSet = Utils.convertToTagSet(`${this.id} ${tags}`);
    this.originalTagsLength = this.tagSet.size;
    this.initializeAdditionalTagSet();
  }

  initializeAdditionalTagSet() {
    this.additionalTagSet = Utils.convertToTagSet(TagModifier.tagModifications.get(this.id) || "");

    if (this.additionalTagSet.size !== 0) {
      this.combineOriginalAndAdditionalTags();
    }
  }

  deleteConsumedPropertiesFromInactivePost() {
    this.inactivePost.metadata = null;
    this.inactivePost.tags = null;
  }

  setupClickLink() {
    if (!Utils.onFavoritesPage()) {
      return;
    }
    this.container.addEventListener("mousedown", (event) => {
      if (event.ctrlKey) {
        return;
      }
      const middleClick = event.button === Utils.clickCodes.middle;
      const leftClick = event.button === Utils.clickCodes.left;
      const shiftClick = leftClick && event.shiftKey;

      if (middleClick || shiftClick || (leftClick && !Utils.galleryEnabled())) {
        Utils.openPostInNewTab(this.id);
      }
    });
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
    this.createMetadataHint();
    content.appendChild(this.root);
  }

  /**
   * @param {HTMLElement} content
   */
  insertAtBeginningOfContent(content) {
    if (this.inactivePost !== null) {
      this.createHTMLElement(this.inactivePost, true);
    }
    this.createMetadataHint();
    content.insertAdjacentElement("afterbegin", this.root);
  }

  addInstanceToAllPosts() {
    if (!Post.allPosts.has(this.id)) {
      Post.allPosts.set(this.id, this);
    }
  }

  toggleMatched() {
    this.setMatched(!this.matchedByLatestSearch);
  }

  /**
   * @param {Boolean} value
   */
  setMatched(value) {
    this.matchedByLatestSearch = value;
  }

  combineOriginalAndAdditionalTags() {
    this.tagSet = Utils.sortSet(Utils.union(this.originalTagSet, this.additionalTagSet));
  }

  /**
   * @param {String} newTags
   * @returns {String}
   */
  addAdditionalTags(newTags) {
    const newTagsSet = Utils.difference(Utils.convertToTagSet(newTags), this.tagSet);

    if (newTagsSet.size > 0) {
      this.additionalTagSet = Utils.union(this.additionalTagSet, newTagsSet);
      this.combineOriginalAndAdditionalTags();
    }
    return this.additionalTagsString;
  }

  /**
   * @param {String} tagsToRemove
   * @returns {String}
   */
  removeAdditionalTags(tagsToRemove) {
    const tagsToRemoveSet = Utils.intersection(Utils.convertToTagSet(tagsToRemove), this.additionalTagSet);

    if (tagsToRemoveSet.size > 0) {
      this.tagSet = Utils.difference(this.tagSet, tagsToRemoveSet);
      this.additionalTagSet = Utils.difference(this.additionalTagSet, tagsToRemoveSet);
    }
    return this.additionalTagsString;
  }

  resetAdditionalTags() {
    if (this.additionalTagSet.size === 0) {
      return;
    }
    this.additionalTagSet = new Set();
    this.combineOriginalAndAdditionalTags();
  }

  /**
   * @returns {HTMLDivElement}
   */
  getMetadataHintElement() {
    return this.container.querySelector(".statistic-hint");
  }

  /**
   * @returns {Boolean}
   */
  hasStatisticHint() {
    return this.getMetadataHintElement() !== null;
  }

  /**
   * @returns {String}
   */
  getMetadataHintValue() {
    switch (Utils.getSortingMethod()) {
      case "score":
        return this.metadata.score;

      case "width":
        return this.metadata.width;

      case "height":
        return this.metadata.height;

      case "creationTimestamp":
        return Utils.convertTimestampToDate(this.metadata.creationTimestamp);

      case "lastChangedTimestamp":
        return Utils.convertTimestampToDate(this.metadata.lastChangedTimestamp * 1000);

      default:
        return this.index;
    }
  }

  async createMetadataHint() {
    // await Utils.sleep(200);
    // let hint = this.getMetadataHintElement();

    // if (hint === null) {
    //   hint = document.createElement("div");
    //   hint.className = "statistic-hint";
    //   this.container.appendChild(hint);
    // }
    // hint.textContent = this.getMetadataHintValue();
  }
}
