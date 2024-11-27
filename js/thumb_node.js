class InactiveThumbNode {
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
   * @param {HTMLElement} thumb
   * @returns {Number}
   */
  static extractRatingFromThumb(thumb) {
    // try {
    //   const rating = (/'rating':'(\S)/).exec(thumb.nextSibling.textContent)[1];
    //   return FavoriteMetadata.encodeRating(rating);
    // } catch {
    //   return 4;
    // }
    return 4;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Number}
   */
  static extractScoreFromThumb(thumb) {
    // try {
    //   const score = (/'score':(\d+)/).exec(thumb.nextSibling.textContent)[1];
    //   return parseInt(score);
    // } catch {
    //   return 0;
    // }
    return 0;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {String}
   */
  static getIdFromThumb(thumb) {
    const elementWithId = onSearchPage() ? thumb : thumb.children[0];
    return elementWithId.id.substring(1);
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
   * @param {HTMLElement | Object} thumb
   */
  constructor(thumb, fromRecord) {
    this.fromRecord = fromRecord;

    if (fromRecord) {
      this.populateAttributesFromDatabaseRecord(thumb);
    } else {
      this.populateAttributesFromHTMLElement(thumb);
    }
  }

  /**
   * @param {{id: String, tags: String, src: String, metadata: String}} record
   */
  populateAttributesFromDatabaseRecord(record) {
    this.id = record.id;
    this.tags = record.tags;
    this.src = InactiveThumbNode.decompressThumbSource(record.src, record.id);
    this.metadata = record.metadata;
  }

  /**
   * @param {HTMLElement} thumb
   */
  populateAttributesFromHTMLElement(thumb) {
    if (onMobileDevice()) {
      const noScriptElement = thumb.querySelector("noscript");

      if (noScriptElement !== null) {
        thumb.children[0].insertAdjacentElement("afterbegin", noScriptElement.children[0]);
      }
    }
    const image = thumb.children[0].children[0];

    this.id = InactiveThumbNode.getIdFromThumb(thumb);
    this.src = image.src;
    this.tags = this.preprocessTags(image);
    // this.rating = InactiveThumbNode.extractRatingFromThumb(thumb);
    // this.score = InactiveThumbNode.extractScoreFromThumb(thumb);
  }

  /**
   * @param {HTMLImageElement} image
   * @returns {String}
   */
  preprocessTags(image) {
    const tags = correctMisspelledTags(image.title);
    return removeExtraWhiteSpace(tags).split(" ").sort().join(" ");
  }

  instantiateMetadata() {
    if (this.fromRecord) {
      return new FavoriteMetadata(this.id, this.metadata);
    }
    const favoritesMetadata = new FavoriteMetadata(this.id);
    // favoritesMetadata.presetRating(this.rating);
    // favoritesMetadata.presetScore(this.score);
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

class ThumbNode {
  /**
   * @type {Map.<String, ThumbNode>}
   */
  static allThumbNodes = new Map();
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
  static currentSortingMethod = getPreference("sortingMethod", "default");
  static settings = {
    deferHTMLElementCreation: true
  };

  static {
    if (!onPostPage()) {
      this.createTemplates();
      this.addEventListeners();
    }
  }

  static createTemplates() {
    ThumbNode.removeFavoriteButtonHTML = `<button class="remove-favorite-button add-or-remove-button"><img src=${createObjectURLFromSvg(ICONS.heartMinus)}></button>`;
    ThumbNode.addFavoriteButtonHTML = `<button class="add-favorite-button add-or-remove-button"><img src=${createObjectURLFromSvg(ICONS.heartPlus)}></button>`;
    const buttonHTML = userIsOnTheirOwnFavoritesPage() ? ThumbNode.removeFavoriteButtonHTML : ThumbNode.addFavoriteButtonHTML;
    const canvasHTML = getPerformanceProfile() > 0 ? "" : "<canvas></canvas>";

    ThumbNode.template = new DOMParser().parseFromString("<div class=\"thumb-node\"></div>", "text/html").createElement("div");
    ThumbNode.template.className = "thumb-node";
    ThumbNode.template.innerHTML = `
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
      const thumbNode = this.allThumbNodes.get(id);

      if (thumbNode !== undefined) {
        thumbNode.swapAddOrRemoveButton();
      }
    });
    window.addEventListener("sortingParametersChanged", () => {
      ThumbNode.currentSortingMethod = getSortingMethod();
      const thumbNodes = Array.from(getAllThumbs()).map(thumb => ThumbNode.allThumbNodes.get(thumb.id));

      for (const thumbNode of thumbNodes) {
        thumbNode.createStatisticHint();
      }
    });
  }

  /**
   * @param {String} id
   * @returns {Number}
   */
  static getPixelCount(id) {
    const thumbNode = ThumbNode.allThumbNodes.get(id);

    if (thumbNode === undefined || thumbNode.metadata === undefined) {
      return 0;
    }
    return thumbNode.metadata.pixelCount;
  }

  /**
   * @param {String} id
   * @returns {String}
   */
  static getExtensionFromThumbNode(id) {
    const thumbNode = ThumbNode.allThumbNodes.get(id);

    if (thumbNode === undefined) {
      return undefined;
    }

    if (thumbNode.metadata.isEmpty()) {
      return undefined;
    }
    return thumbNode.metadata.extension;
  }

  /**
   * @type {Map.<String, ThumbNode>}
   */
  static get thumbNodesMatchedBySearch() {
    const thumbNodes = new Map();

    for (const [id, thumbNode] of ThumbNode.allThumbNodes.entries()) {
      if (thumbNode.matchedByMostRecentSearch) {
        thumbNodes.set(id, thumbNode);
      }
    }
    return thumbNodes;
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
   * @type {InactiveThumbNode}
   */
  inactiveThumbNode;
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
   * @type {FavoriteMetadata}
   */
  metadata;

  /**
   * @type {String}
   */
  get href() {
    return `https://rule34.xxx/index.php?page=post&s=view&id=${this.id}`;
  }

  /**
   * @type {String}
   */
  get compressedThumbSource() {
    const source = this.inactiveThumbNode === null ? this.image.src : this.inactiveThumbNode.src;
    return source.match(ThumbNode.thumbSourceCompressionRegex).splice(1).join("_");
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
    return convertToTagString(this.originalTagSet);
  }

  /**
   * @type {String}
   */
  get additionalTagsString() {
    return convertToTagString(this.additionalTags);
  }

  /**
   * @param {HTMLElement | Object} thumb
   * @param {Boolean} fromRecord
   */
  constructor(thumb, fromRecord) {
    this.initializeFields();
    this.initialize(new InactiveThumbNode(thumb, fromRecord));
    this.setMatched(true);
    this.addInstanceToAllThumbNodes();
  }

  initializeFields() {
    this.inactiveThumbNode = null;
    this.essentialAttributesPopulated = false;
    this.htmlElementCreated = false;
  }

  /**
   * @param {InactiveThumbNode} inactiveThumbNode
   */
  initialize(inactiveThumbNode) {
    if (ThumbNode.settings.deferHTMLElementCreation) {
      this.inactiveThumbNode = inactiveThumbNode;
      this.populateEssentialAttributes(inactiveThumbNode);
    } else {
      this.createHTMLElement(inactiveThumbNode);
    }
  }

  /**
   * @param {InactiveThumbNode} inactiveThumbNode
   */
  populateEssentialAttributes(inactiveThumbNode) {
    if (this.essentialAttributesPopulated) {
      return;
    }
    this.essentialAttributesPopulated = true;
    this.populateNonHTMLAttributes(inactiveThumbNode);
    this.initializeAdditionalTags();
    this.deleteConsumedProperties(inactiveThumbNode);
  }

  /**
   * @param {InactiveThumbNode} inactiveThumbNode
   */
  createHTMLElement(inactiveThumbNode) {
    if (this.htmlElementCreated) {
      return;
    }
    this.htmlElementCreated = true;
    this.instantiateTemplate();
    this.populateEssentialAttributes(inactiveThumbNode);
    this.populateHTMLAttributes(inactiveThumbNode);
    this.setupAddOrRemoveButton();
    this.setupClickLink();
    this.deleteInactiveThumbNode();
  }

  activateHTMLElement() {
    if (this.inactiveThumbNode !== null) {
      this.createHTMLElement(this.inactiveThumbNode);
    }
  }

  instantiateTemplate() {
    this.root = ThumbNode.template.cloneNode(true);
    this.container = this.root.children[0];
    this.image = this.root.children[0].children[0];
    this.addOrRemoveButton = this.root.children[0].children[1];
  }

  setupAddOrRemoveButton() {
    if (userIsOnTheirOwnFavoritesPage()) {
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
    removeFavorite(this.id);
    this.swapAddOrRemoveButton();
  }

  /**
   * @param {MouseEvent} event
   */
  addFavoriteButtonOnClick(event) {
    event.stopPropagation();
    addFavorite(this.id);

    this.swapAddOrRemoveButton();
  }

  swapAddOrRemoveButton() {
    const isRemoveFavoriteButton = this.addOrRemoveButton.classList.contains("remove-favorite-button");

    if (isRemoveFavoriteButton) {
      this.addOrRemoveButton.outerHTML = ThumbNode.addFavoriteButtonHTML;
      this.addOrRemoveButton = this.root.children[0].children[1];
      this.addOrRemoveButton.onclick = this.addFavoriteButtonOnClick.bind(this);
    } else {
      this.addOrRemoveButton.outerHTML = ThumbNode.removeFavoriteButtonHTML;
      this.addOrRemoveButton = this.root.children[0].children[1];
      this.addOrRemoveButton.onclick = this.removeFavoriteButtonOnClick.bind(this);
    }
  }

  /**
   * @param {InactiveThumbNode} inactiveThumbNode
   */
  populateNonHTMLAttributes(inactiveThumbNode) {
    this.id = inactiveThumbNode.id;
    this.tagSet = convertToTagSet(`${inactiveThumbNode.id} ${inactiveThumbNode.tags}`);
    this.metadata = inactiveThumbNode.instantiateMetadata();
  }

  /**
   * @param {InactiveThumbNode} inactiveThumbNode
   */
  populateHTMLAttributes(inactiveThumbNode) {
    this.image.src = inactiveThumbNode.src;
    this.image.classList.add(getContentType(inactiveThumbNode.tags || convertToTagString(this.tagSet)));
    this.root.id = inactiveThumbNode.id;
  }

  initializeAdditionalTags() {
    this.originalTagsLength = this.tagSet.size;
    this.additionalTags = convertToTagSet(TagModifier.tagModifications.get(this.id) || "");

    if (this.additionalTags.size !== 0) {
      this.updateTags();
    }
  }

  /**
   * @param {InactiveThumbNode} inactiveThumbNode
   */
  deleteConsumedProperties(inactiveThumbNode) {
    inactiveThumbNode.metadata = null;
    inactiveThumbNode.tags = null;
  }

  setupClickLink() {
    if (usingRenderer()) {
      this.container.setAttribute("href", this.href);
    } else {
      this.container.setAttribute("onclick", `window.open("${this.href}")`);
    }
  }

  deleteInactiveThumbNode() {
    if (this.inactiveThumbNode !== null) {
      this.inactiveThumbNode.clear();
      this.inactiveThumbNode = null;
    }
  }

  /**
   * @param {HTMLElement} content
   */
  insertAtEndOfContent(content) {
    if (this.inactiveThumbNode !== null) {
      this.createHTMLElement(this.inactiveThumbNode, true);
    }
    this.createStatisticHint();
    content.appendChild(this.root);
  }

  /**
   * @param {HTMLElement} content
   */
  insertAtBeginningOfContent(content) {
    if (this.inactiveThumbNode !== null) {
      this.createHTMLElement(this.inactiveThumbNode, true);
    }
    this.createStatisticHint();
    content.insertAdjacentElement("afterbegin", this.root);
  }

  addInstanceToAllThumbNodes() {
    if (!ThumbNode.allThumbNodes.has(this.id)) {
      ThumbNode.allThumbNodes.set(this.id, this);
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

  updateTags() {
    this.tagSet = this.originalTagSet;
    this.tagSet = union(this.tagSet, this.additionalTags);
  }

  /**
   * @param {String} newTags
   * @returns {String}
   */
  addAdditionalTags(newTags) {
    const newTagsSet = convertToTagSet(newTags);

    if (newTagsSet.size > 0) {
      this.additionalTags = union(this.additionalTags, newTagsSet);
      this.updateTags();
    }
    return this.additionalTagsString;
  }

  /**
   * @param {String} tagsToRemove
   * @returns {String}
   */
  removeAdditionalTags(tagsToRemove) {
    const tagsToRemoveSet = convertToTagSet(tagsToRemove);

    if (tagsToRemoveSet.size > 0) {
      this.additionalTags = difference(this.additionalTags, tagsToRemoveSet);
      this.updateTags();
    }
    return this.additionalTagsString;
  }

  resetAdditionalTags() {
    if (this.additionalTags.size === 0) {
      return;
    }
    this.additionalTags = new Set();
    this.updateTags();
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
    switch (ThumbNode.currentSortingMethod) {
      case "score":
        return this.metadata.score;

      case "width":
        return this.metadata.width;

      case "height":
        return this.metadata.height;

      case "create":
        return convertTimestampToDate(this.metadata.creationTimestamp);

      case "change":
        return convertTimestampToDate(this.metadata.lastChangedTimestamp * 1000);

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
