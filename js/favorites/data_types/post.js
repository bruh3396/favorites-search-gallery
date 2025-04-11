class Post {
  /** @type {Map<String, Post>} */
  static allPosts = new Map();
  /** @type {RegExp} */
  static thumbnailSourceCompressionRegex = /thumbnails\/\/([0-9]+)\/thumbnail_([0-9a-f]+)/;
  /** @type {HTMLElement} */
  static htmlTemplate;
  /** @type {String} */
  static removeFavoriteButtonHTML;
  /** @type {String} */
  static addFavoriteButtonHTML;

  static {
    Utils.addStaticInitializer(() => {
      if (Flags.onFavoritesPage) {
        Post.createHTMLTemplates();
        Post.addEventListeners();
      }
    });
  }

  static createHTMLTemplates() {
    Post.createAddFavoriteButtonHTMLTemplate();
    Post.createRemoveFavoriteButtonHTMLTemplate();
    Post.createPostHTMLTemplate();
  }

  static createRemoveFavoriteButtonHTMLTemplate() {
    Post.removeFavoriteButtonHTML = `<img class="remove-favorite-button add-or-remove-button" src=${Utils.createObjectURLFromSvg(SVGIcons.heartMinus)}>`;
  }

  static createAddFavoriteButtonHTMLTemplate() {
    Post.addFavoriteButtonHTML = `<img class="add-favorite-button add-or-remove-button" src=${Utils.createObjectURLFromSvg(SVGIcons.heartPlus)}>`;
  }

  static createPostHTMLTemplate() {
    const buttonHTML = Flags.userIsOnTheirOwnFavoritesPage ? Post.removeFavoriteButtonHTML : Post.addFavoriteButtonHTML;
    const canvasHTML = Preferences.performanceProfile.value > 0 ? "" : "<canvas></canvas>";
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
    Post.swapAddOrRemoveButtonsWhenFavoritesAreAddedOrRemovedExternally();
  }

  static swapAddOrRemoveButtonsWhenFavoritesAreAddedOrRemovedExternally() {
    Events.gallery.favoriteAddedOrDeleted.on((id) => {
      const post = Post.allPosts.get(id);

      if (post !== undefined) {
        post.swapAddOrRemoveButton();
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
   * @param {String} apiTags
   * @param {String} fileURL
   */
  static validateExtractedTagsAgainstAPI(id, apiTags, fileURL) {
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
      apiTagSet.delete("video");
      apiTagSet.delete("animated");
    }
    postTagSet.delete(id);

    if (apiTagSet.symmetricDifference(postTagSet).size > 0) {
      post.initializeTagSets(Utils.convertToTagString(apiTagSet));
    }
  }

  /** @type {String} */
  id;
  /** @type {HTMLElement} */
  root;
  /** @type {HTMLAnchorElement} */
  container;
  /** @type {HTMLImageElement} */
  image;
  /** @type {HTMLImageElement} */
  addOrRemoveButton;
  /** @type {InactivePost | null} */
  inactivePost;
  /** @type {PostMetadata} */
  metadata;
  /** @type {Set<String>} */
  tagSet;
  /** @type {Set<String>} */
  additionalTagSet;
  /** @type {Boolean} */
  attributesNeededForSearchArePopulated;
  /** @type {Boolean} */
  htmlElementCreated;

  /** @type {String} */
  get compressedThumbSource() {
    return ImageUtils.compressThumbSource(this.thumbURL);
  }

  /** @type {FavoritesDatabaseRecord} */
  get databaseRecord() {
    return {
      id: this.id,
      tags: this.originalTagString,
      src: this.compressedThumbSource,
      metadata: this.metadata.json
    };
  }

  /** @type {Set<String>} */
  get originalTagSet() {
    return this.tagSet.difference(this.additionalTagSet);
  }

  /** @type {String} */
  get originalTagString() {
    return Utils.convertToTagString(this.originalTagSet);
  }

  /** @type {String} */
  get additionalTagString() {
    return Utils.convertToTagString(this.additionalTagSet);
  }

  /** @type {String} */
  get thumbURL() {
    return this.inactivePost === null ? this.image.src : this.inactivePost.src;
  }

  /** @type {Boolean} */
  get isVideo() {
    return !Constants.videoTagSet.isDisjointFrom(this.tagSet);
  }

  /** @type {Boolean} */
  get isGif() {
    return !Constants.animatedTagSet.isDisjointFrom(this.tagSet) && !this.isVideo;
  }

  /** @type {Boolean} */
  get isAnimated() {
    return this.isVideo || this.isGif;
  }

  /** @type {Boolean} */
  get isImage() {
    return !this.isAnimated;
  }

  /**
   * @param {HTMLElement | FavoritesDatabaseRecord} entity
   */
  constructor(entity) {
    this.initializeFields();
    this.inactivePost = new InactivePost(entity);
    this.populateAttributesNeededForSearch();
    this.addInstanceToAllPosts();
  }

  initializeFields() {
    this.inactivePost = null;
    this.attributesNeededForSearchArePopulated = false;
    this.htmlElementCreated = false;
  }

  populateAttributesNeededForSearch() {
    if (this.attributesNeededForSearchArePopulated || this.inactivePost === null) {
      return;
    }
    this.attributesNeededForSearchArePopulated = true;
    this.id = this.inactivePost.id;
    this.metadata = this.inactivePost.createMetadata();
    this.initializeTagSets(this.inactivePost.tags);
    this.deleteConsumedPropertiesFromInactivePost();
  }

  createHTMLElement() {
    if (this.htmlElementCreated) {
      return;
    }
    this.htmlElementCreated = true;
    this.instantiateHTMLTemplate();
    this.populateAttributesNeededForSearch();
    this.populateHTMLAttributes();
    this.setupAddOrRemoveButton(Flags.userIsOnTheirOwnFavoritesPage);
    this.openAssociatedPostInNewTabWhenClicked();
    this.presetCanvasDimensions();
    this.deleteInactivePost();
  }

  activateHTMLElement() {
    if (this.inactivePost !== null) {
      this.createHTMLElement();
    }
  }

  instantiateHTMLTemplate() {
    // @ts-ignore
    this.root = Post.htmlTemplate.cloneNode(true);
    // @ts-ignore
    this.container = this.root.children[0];
    // @ts-ignore
    this.image = this.root.children[0].children[0];
    // @ts-ignore
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
    // @ts-ignore
    this.addOrRemoveButton = this.root.children[0].children[1];
    this.setupAddOrRemoveButton(!isRemoveButton);
  }

  populateHTMLAttributes() {
    if (this.inactivePost === null) {
      return;
    }
    this.image.src = this.inactivePost.src;
    this.image.classList.add(Utils.getContentType(this.inactivePost.tags || Utils.convertToTagString(this.tagSet)));
    this.root.id = this.inactivePost.id;
  }

  /**
   * @param {String} tags
   */
  initializeTagSets(tags) {
    this.tagSet = Utils.convertToTagSet(`${this.id} ${tags}`);
    this.additionalTagSet = Utils.convertToTagSet(TagModifier.tagModifications.get(this.id) || "");

    if (this.additionalTagSet.size > 0) {
      this.combineOriginalAndAdditionalTagSets();
    }
  }

  deleteConsumedPropertiesFromInactivePost() {
    if (this.inactivePost !== null) {
      this.inactivePost.metadata = null;
      this.inactivePost.tags = "";
    }
  }

  openAssociatedPostInNewTabWhenClicked() {
    if (!Flags.onFavoritesPage) {
      return;
    }

    this.container.onclick = (event) => {
      if (event.ctrlKey) {
        ImageUtils.openOriginalImageInNewTab(this.root);
      }
    };
    this.container.addEventListener("mousedown", (event) => {
      if (event.ctrlKey) {
        return;
      }
      const middleClick = event.button === Utils.clickCodes.middle;
      const leftClick = event.button === Utils.clickCodes.left;
      const shiftClick = leftClick && event.shiftKey;

      if (middleClick || shiftClick || (leftClick && Flags.galleryDisabled)) {
        event.preventDefault();
        Utils.openPostInNewTab(this.id);
      }
    });
  }

  presetCanvasDimensions() {
    const canvas = this.root.querySelector("canvas");

    if (canvas === null || this.metadata.isEmpty) {
      return;
    }
    canvas.dataset.size = `${this.metadata.width}x${this.metadata.height}`;
  }

  deleteInactivePost() {
    this.inactivePost = null;
  }

  addInstanceToAllPosts() {
    if (!Post.allPosts.has(this.id)) {
      Post.allPosts.set(this.id, this);
    }
  }

  combineOriginalAndAdditionalTagSets() {
    const union = this.originalTagSet.union(this.additionalTagSet);

    this.tagSet = new Set(Array.from(union).sort());
  }

  /**
   * @param {String} newTags
   * @returns {String}
   */
  addAdditionalTags(newTags) {
    const newTagsSet = Utils.convertToTagSet(newTags).difference(this.tagSet);

    if (newTagsSet.size > 0) {
      this.additionalTagSet = this.additionalTagSet.union(newTagsSet);
      this.combineOriginalAndAdditionalTagSets();
    }
    return this.additionalTagString;
  }

  /**
   * @param {String} tagsToRemove
   * @returns {String}
   */
  removeAdditionalTags(tagsToRemove) {
    const tagsToRemoveSet = Utils.convertToTagSet(tagsToRemove).intersection(this.additionalTagSet);

    if (tagsToRemoveSet.size > 0) {
      this.tagSet = this.tagSet.difference(tagsToRemoveSet);
      this.additionalTagSet = this.additionalTagSet.difference(tagsToRemoveSet);
    }
    return this.additionalTagString;
  }

  resetAdditionalTags() {
    if (this.additionalTagSet.size === 0) {
      return;
    }
    this.additionalTagSet = new Set();
    this.combineOriginalAndAdditionalTagSets();
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
   * @returns {Promise<{url: String, extension: String}>}
   */
  async getOriginalFileURL() {
    const thumbURL = this.inactivePost === null ? this.image.src : this.inactivePost.src;
    let extension;

    if (this.isVideo) {
      extension = "mp4";
    } else if (this.isGif) {
      extension = "gif";
    } else {
      extension = await ImageUtils.getImageExtensionFromId(this.id);
    }
    const url = ImageUtils.getOriginalImageURLFromIdAndThumbURL(this.id, thumbURL).replace(".jpg", `.${extension}`);
    return {
      url,
      extension
    };
  }
}
