const THUMB_NODE_TEMPLATE = new DOMParser().parseFromString("<div></div>", "text/html").createElement("div");
const CANVAS_HTML = getPerformanceProfile() > 0 ? "" : "<canvas></canvas>";
const REMOVE_BUTTON_HTML = userIsOnTheirOwnFavoritesPage() ? "<button class=\"remove-button light-green-gradient\" style=\"visibility: hidden;\">Remove</button>" : "";

THUMB_NODE_TEMPLATE.className = "thumb-node";

THUMB_NODE_TEMPLATE.innerHTML = `
    <div>
      <img loading="lazy">
      ${REMOVE_BUTTON_HTML}
      ${CANVAS_HTML}
    </div>
`;

class ThumbNode {
  static baseURLs = {
    post: "https://rule34.xxx/index.php?page=post&s=view&id=",
    remove: "https://rule34.xxx/index.php?page=favorites&s=delete&id="
  };
  static thumbSourceExtractionRegex = /thumbnails\/\/([0-9]+)\/thumbnail_([0-9a-f]+)/;
  static parser = new DOMParser();

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
   * @type {Map.<String, ThumbNode>}
   */
  static allThumbNodes = new Map();

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
  removeButton;
  /**
   * @type {String}
   */
  originalTags;
  /**
   * @type {String}
   */
  additionalTags;
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
  get removeURL() {
    return ThumbNode.baseURLs.remove + this.id;
  }

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
    this.setupRemoveButton();
    this.setupOnClickLink();
    this.setFlags();
    this.addInstanceToAllThumbNodes();
  }

  instantiateTemplate() {
    this.root = THUMB_NODE_TEMPLATE.cloneNode(true);
    this.container = this.root.children[0];
    this.image = this.root.children[0].children[0];
    this.removeButton = userIsOnTheirOwnFavoritesPage() ? this.root.children[0].children[1] : null;
  }

  setupRemoveButton() {
    if (this.removeButton === null) {
      return;
    }
    this.removeButton.onclick = (event) => {
      event.stopPropagation();
      setIdToBeRemovedOnReload(this.id);
      fetch(this.removeURL);
      this.removeButton.remove();
    };
  }

  /**
   * @param {HTMLElement | {id: String, tags: String, src: String, type: String}} thumb
   * @param {Boolean} fromDatabaseRecord
   */
  populateAttributes(thumb, fromDatabaseRecord) {
    if (fromDatabaseRecord) {
      this.createFromDatabaseRecord(thumb);
    } else {
      this.createFromHTMLElement(thumb);
    }
    this.root.id = this.id;
    this.additionalTags = TagModifier.tagModifications.get(this.id) || "";
    this.updateTags();
  }

  /**
   * @param {{id: String, tags: String, src: String, type: String, metadata: String}} record
   */
  createFromDatabaseRecord(record) {
    this.image.src = ThumbNode.decompressThumbSource(record.src, record.id);
    this.id = record.id;
    this.originalTags = record.tags;
    this.image.classList.add(record.type);
    this.metadata = new FavoriteMetadata(this.id, record.metadata);
  }

  /**
   * @param {HTMLElement} thumb
   */
  createFromHTMLElement(thumb) {
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
    this.image.classList.add(getContentType(this.originalTags));
    this.metadata = new FavoriteMetadata(this.id);
  }

  setupOnClickLink() {
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
    const finalTags = this.mergeTags(this.originalTags, this.additionalTags);

    this.image.setAttribute("tags", finalTags);
    this.postTags = new PostTags(finalTags);
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
