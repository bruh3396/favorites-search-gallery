class ThumbNode {
  /**
   * @type {Map.<String, ThumbNode>}
   */
  static allThumbNodes = new Map();
  /**
   * @type {RegExp}
  */
  static thumbSourceExtractionRegex = /thumbnails\/\/([0-9]+)\/thumbnail_([0-9a-f]+)/;
  /**
   * @type {DOMParser}
  */
  static parser = new DOMParser();
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

  static {
    if (!onPostPage()) {
      this.createTemplates();
      this.addEventListeners();
    }
  }

  static createTemplates() {
    ThumbNode.template = ThumbNode.parser.parseFromString("<div class=\"thumb-node\"></div>", "text/html").createElement("div");
    const canvasHTML = getPerformanceProfile() > 0 ? "" : "<canvas></canvas>";
    const heartPlusBlobURL = createObjectURLFromSvg(ICONS.heartPlus);
    const heartMinusBlobURL = createObjectURLFromSvg(ICONS.heartMinus);
    const heartPlusImageHTML = `<img src=${heartPlusBlobURL}>`;
    const heartMinusImageHTML = `<img src=${heartMinusBlobURL}>`;

    ThumbNode.removeFavoriteButtonHTML = `<button class="remove-favorite-button auxillary-button">${heartMinusImageHTML}</button>`;
    ThumbNode.addFavoriteButtonHTML = `<button class="add-favorite-button auxillary-button">${heartPlusImageHTML}</button>`;
    const auxillaryButtonHTML = userIsOnTheirOwnFavoritesPage() ? ThumbNode.removeFavoriteButtonHTML : ThumbNode.addFavoriteButtonHTML;

    ThumbNode.template.className = "thumb-node";
    ThumbNode.template.innerHTML = `
        <div>
          <img loading="lazy">
          ${auxillaryButtonHTML}
          ${canvasHTML}
        </div>
    `;
  }

  static addEventListeners() {
    window.addEventListener("favoriteAddedOrDeleted", (event) => {
      const id = event.detail;
      const thumbNode = this.allThumbNodes.get(id);

      if (thumbNode !== undefined) {
        thumbNode.swapAuxillaryButton();
      }
    });
  }

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
   * @returns {String}
   */
  static getIdFromThumb(thumb) {
    const elementWithId = onSearchPage() ? thumb : thumb.children[0];
    return elementWithId.id.substring(1);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Number}
   */
  static extractRatingFromThumb(thumb) {
    const rating = (/'rating':'(\S)/).exec(thumb.nextSibling.textContent)[1];
    return FavoriteMetadata.encodeRating(rating);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Number}
   */
  static extractScoreFromThumb(thumb) {
    const score = (/'score':(\d+)/).exec(thumb.nextSibling.textContent)[1];
    return parseInt(score);
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
   * @type {HTMLDivElement}
   */
  root;
  /**
   * @type {String}
   */
  id;
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
  auxillaryButton;
  /**
   * @type {Set.<String>}
   */
  additionalTags;
  /**
   * @type {Number}
  */
  originalTagsLength;
  /**
   * @type {Set.<String>}
   */
  tagSet;
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
    return this.image.src.match(ThumbNode.thumbSourceExtractionRegex).splice(1).join("_");
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
   * @param {HTMLElement | {id: String, tags: String, src: String, type: String}} thumb
   * @param {Boolean} fromRecord
   */
  constructor(thumb, fromRecord) {
    this.instantiateTemplate();
    this.populateAttributes(thumb, fromRecord);
    this.setupAuxillaryButton();
    this.setupClickLink();
    this.setMatched(true);
    this.addInstanceToAllThumbNodes();
  }

  instantiateTemplate() {
    this.root = ThumbNode.template.cloneNode(true);
    this.container = this.root.children[0];
    this.image = this.root.children[0].children[0];
    this.auxillaryButton = this.root.children[0].children[1];
  }

  setupAuxillaryButton() {
    if (userIsOnTheirOwnFavoritesPage()) {
      this.auxillaryButton.onclick = this.removeFavoriteButtonOnClick.bind(this);
    } else {
      this.auxillaryButton.onclick = this.addFavoriteButtonOnClick.bind(this);
    }
  }

  /**
   * @param {MouseEvent} event
   */
  removeFavoriteButtonOnClick(event) {
    event.stopPropagation();
    removeFavorite(this.id);
    this.swapAuxillaryButton();
  }
  /**
   * @param {MouseEvent} event
   */
  addFavoriteButtonOnClick(event) {
    event.stopPropagation();
    addFavorite(this.id);

    this.swapAuxillaryButton();
  }

  swapAuxillaryButton() {
    const isRemoveFavoriteButton = this.auxillaryButton.classList.contains("remove-favorite-button");

    if (isRemoveFavoriteButton) {
      this.auxillaryButton.outerHTML = ThumbNode.addFavoriteButtonHTML;
      this.auxillaryButton = this.root.children[0].children[1];
      this.auxillaryButton.onclick = this.addFavoriteButtonOnClick.bind(this);
    } else {
      this.auxillaryButton.outerHTML = ThumbNode.removeFavoriteButtonHTML;
      this.auxillaryButton = this.root.children[0].children[1];
      this.auxillaryButton.onclick = this.removeFavoriteButtonOnClick.bind(this);
    }
  }

  /**
   * @param {HTMLElement | {id: String, tags: Set.<String>, src: String, type: String, metadata: String}} thumb
   * @param {Boolean} fromDatabaseRecord
   */
  populateAttributes(thumb, fromDatabaseRecord) {
    if (fromDatabaseRecord) {
      this.populateAttributesFromDatabaseRecord(thumb);
    } else {
      this.populateAttributesFromHTMLElement(thumb);
    }
    this.root.id = this.id;
    this.originalTagsLength = this.tagSet.size;
    this.additionalTags = convertToTagSet(TagModifier.tagModifications.get(this.id) || "");

    if (this.additionalTags.size !== 0) {
      this.updateTags();
    }
  }

  /**
   * @param {{id: String, tags: Set.<String>, src: String, type: String, metadata: String}} record
   */
  populateAttributesFromDatabaseRecord(record) {
    this.image.src = ThumbNode.decompressThumbSource(record.src, record.id);
    this.id = record.id;
    this.tagSet = convertToTagSet(record.tags);
    this.image.className = record.type;
    this.metadata = new FavoriteMetadata(this.id, record.metadata || null);
  }

  /**
   * @param {HTMLElement} thumb
   */
  populateAttributesFromHTMLElement(thumb) {
    if (onMobileDevice()) {
      const noScript = thumb.querySelector("noscript");

      if (noScript !== null) {
        thumb.children[0].insertAdjacentElement("afterbegin", noScript.children[0]);
      }
    }
    const imageElement = thumb.children[0].children[0];

    this.image.src = imageElement.src;
    this.id = ThumbNode.getIdFromThumb(thumb);
    const thumbTags = correctMisspelledTags(imageElement.title);

    this.tagSet = convertToTagSet(thumbTags);
    this.tagSet.add(this.id);
    this.image.classList.add(getContentType(thumbTags));
    this.metadata = new FavoriteMetadata(this.id);
    this.metadata.presetRating(ThumbNode.extractRatingFromThumb(thumb));
    this.metadata.presetScore(ThumbNode.extractScoreFromThumb(thumb));
  }

  setupClickLink() {
    if (usingRenderer()) {
      this.container.setAttribute("href", this.href);
    } else {
      this.container.setAttribute("onclick", `window.open("${this.href}")`);
    }
  }

  /**
   * @param {HTMLElement} element
   * @param {String} position
   */
  insertInDocument(element, position) {
    element.insertAdjacentElement(position, this.root);
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
}
