class ThumbNode {
  /**
   * @type {Map.<String, ThumbNode>}
   */
  static allThumbNodes = new Map();
  static baseURLs = {
    post: "https://rule34.xxx/index.php?page=post&s=view&id="
  };
  static thumbSourceExtractionRegex = /thumbnails\/\/([0-9]+)\/thumbnail_([0-9a-f]+)/;
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
  /**
   * @type {String}
  */
  static auxillaryButtonHTML;

  static {
    this.createTemplates();
    this.addEventListeners();
  }

  static createTemplates() {
    ThumbNode.template = ThumbNode.parser.parseFromString("<div></div>", "text/html").createElement("div");
    const canvasHTML = getPerformanceProfile() > 0 ? "" : "<canvas></canvas>";
    const heartPlusBlobURL = createObjectURLFromSvg(ICONS.heartPlus);
    const heartMinusBlobURL = createObjectURLFromSvg(ICONS.heartMinus);
    const heartPlusImageHTML = `<img src=${heartPlusBlobURL}>`;
    const heartMinusImageHTML = `<img src=${heartMinusBlobURL}>`;

    ThumbNode.removeFavoriteButtonHTML = `<button class="remove-favorite-button auxillary-button light-green-gradient">${heartMinusImageHTML}</button>`;
    ThumbNode.addFavoriteButtonHTML = `<button class="add-favorite-button auxillary-button light-green-gradient">${heartPlusImageHTML}</button>`;
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
   *
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
   * @type {String}
   */
  originalTags;
  /**
   * @type {String}
   */
  additionalTags;
  /**
   * @type {String}
  */
  finalTags;
  /**
   * @type {PostTags}
   */
  postTags;
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
    return ThumbNode.baseURLs.post + this.id;
  }

  /**
   * @type {String[]}
   */
  get tagList() {
    return this.originalTags.split(" ");
  }

  /**
   * @type {{id: String, tags: String, src: String, metadata: String}}
   */
  get databaseRecord() {
    return {
      id: this.id,
      tags: this.originalTags,
      src: this.compressedThumbSource,
      metadata: this.metadata.json
    };
  }

  /**
   * @type {String}
   */
  get compressedThumbSource() {
    return this.image.src.match(ThumbNode.thumbSourceExtractionRegex).splice(1).join("_");
  }

  /**
   * @type {Boolean}
   */
  get isVisible() {
    return this.root.style.display !== "none";
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
    this.setFlags();
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
   * @param {HTMLElement | {id: String, tags: String, src: String, type: String}} thumb
   * @param {Boolean} fromDatabaseRecord
   */
  populateAttributes(thumb, fromDatabaseRecord) {
    if (fromDatabaseRecord) {
      this.populateAttributesFromDatabaseRecord(thumb);
    } else {
      this.populateAttributesFromHTMLElement(thumb);
    }
    this.root.id = this.id;
    this.additionalTags = TagModifier.tagModifications.get(this.id) || "";
    this.updateTags();
  }

  /**
   * @param {{id: String, tags: String, src: String, type: String, metadata: String}} record
   */
  populateAttributesFromDatabaseRecord(record) {
    this.image.src = ThumbNode.decompressThumbSource(record.src, record.id);
    this.id = record.id;
    this.originalTags = record.tags;
    this.finalTags = record.tags;
    this.image.className = record.type;

    if (record.metadata === undefined) {
      record.metadata = null;
    }
    this.metadata = new FavoriteMetadata(this.id, record.metadata);
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
    this.originalTags = `${correctMisspelledTags(imageElement.title)} ${this.id}`;
    this.finalTags = this.originalTags;
    this.image.classList.add(getContentType(this.originalTags));
    this.metadata = new FavoriteMetadata(this.id);
    this.metadata.presetRating(ThumbNode.extractRatingFromThumb(thumb));
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

  /**
   * @param {Boolean} value
   */
  toggleVisibility(value) {
    this.root.style.display = value ? "" : "none";
  }

  setFlags() {
    this.matchedByMostRecentSearch = true;
  }

  addInstanceToAllThumbNodes() {
    if (!ThumbNode.allThumbNodes.has(this.id)) {
      ThumbNode.allThumbNodes.set(this.id, this);
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleMatched(value) {
    if (value === undefined) {
      this.matchedByMostRecentSearch = !this.matchedByMostRecentSearch;
    } else {
      this.matchedByMostRecentSearch = value;
    }
  }

  /**
   *
   * @param {String} oldTags
   * @param {String} newTags
   * @returns {String}
   */
  mergeTags(oldTags, newTags) {
    if (newTags === "") {
      return oldTags;
    }
    oldTags = removeExtraWhiteSpace(oldTags);
    newTags = removeExtraWhiteSpace(newTags);
    const finalTags = new Set(oldTags.split(" "));

    for (const newTag of newTags.split(" ")) {
      if (newTag !== "") {
        finalTags.add(newTag);
      }
    }
    return finalTags.size > 0 ? removeExtraWhiteSpace(Array.from(finalTags.keys()).join(" ")) : "";
  }

  updateTags() {
    this.finalTags = this.mergeTags(this.originalTags, this.additionalTags);

    // this.image.setAttribute("tags", finalTags);
    this.postTags = new PostTags(this.finalTags);
  }

  /**
   * @param {String} newTags
   * @returns {String}
   */
  addAdditionalTags(newTags) {
    this.additionalTags = this.mergeTags(this.additionalTags, newTags);
    this.updateTags();
    return this.additionalTags;
  }

  /**
 * @param {String} tagsToRemove
 * @returns {String}
 */
  removeAdditionalTags(tagsToRemove) {
    const tagsToRemoveList = tagsToRemove.split(" ");

    this.additionalTags = Array.from(this.additionalTags.split(" "))
      .filter(tag => !tagsToRemoveList.includes(tag))
      .join(" ");
    this.updateTags();
    return this.additionalTags;
  }

  resetAdditionalTags() {
    if (this.additionalTags === "") {
      return;
    }
    this.additionalTags = "";
    this.updateTags();
  }
}
