const THUMB_NODE_DOM = new DOMParser().parseFromString("<div></div>", "text/html");
const THUMB_NODE_TEMPLATE = THUMB_NODE_DOM.createElement("div");

THUMB_NODE_TEMPLATE.className = "thumb-node";
THUMB_NODE_TEMPLATE.innerHTML = `
    <div>
      <img loading="lazy">
      <button class="remove-button light-green-gradient" style="visibility: hidden;">Remove</button>
    </div>
`;

class ThumbNode {
  static baseRule34URL = {
    post: "https://rule34.xxx/index.php?page=post&s=view&id=",
    remove: "https://rule34.xxx/index.php?page=favorites&s=delete&id="
  };
  static thumbnailExtractionRegex = /thumbnails\/\/([0-9]+)\/thumbnail_([0-9a-f]+)/;

  /**
   * @param {String} source
   * @param {String} id
   * @returns {String}
   */
  static reconstructThumbnailSource(source, id) {
    source = source.split("_");
    return `https://us.rule34.xxx/thumbnails//${source[0]}/thumbnail_${source[1]}.jpg?${id}`;
  }

  /**
   * @param {String} id
   */
  static setIdToBeRemovedOnReload(id) {
    const idsToRemoveOnReload = getIdsToRemoveOnReload();

    idsToRemoveOnReload.push(id);
    localStorage.setItem(IDS_TO_REMOVE_ON_RELOAD_KEY, JSON.stringify(idsToRemoveOnReload));
  }

  /**
   * @param {HTMLElement} thumbElement
   * @returns {String}
   */
  static getIdFromThumbElement(thumbElement) {
    const elementWithId = onPostPage() ? thumbElement : thumbElement.children[0];
    return elementWithId.id.substring(1);
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
   * @type {String}
   */
  tagsString;
  /**
   * @type {PostTags}
   */
  postTags;
  /**
   * @type {HTMLButtonElement}
   */
  removeButton;

  /**
   * @type {String}
   */
  get removeURL() {
    return ThumbNode.baseRule34URL.remove + this.id;
  }

  /**
   * @type {String}
   */
  get href() {
    return ThumbNode.baseRule34URL.post + this.id;
  }

  /**
   * @type {String[]}
   */
  get tagList() {
    return this.tagsString.split(" ");
  }

  /**
   * @type {{id: String, tags: String, src: String}}
   */
  get databaseRecord() {
    return {
      id: this.id,
      tags: this.tagsString,
      src: this.compressedThumbnailSource
    };
  }

  /**
   * @type {String}
   */
  get compressedThumbnailSource() {
    return this.image.src.match(ThumbNode.thumbnailExtractionRegex).splice(1).join("_");
  }

  /**
   * @type {Boolean}
   */
  get isVisible() {
    return this.root.style.display !== "none";
  }

  /**
   * @param {HTMLElement | {id: String, tags: String, src: String, type: String}} thumbObject
   * @param {Boolean} createFromRecord
   */
  constructor(thumbObject, createFromRecord) {
    this.root = THUMB_NODE_TEMPLATE.cloneNode(true);
    this.container = this.root.children[0];
    this.image = this.root.children[0].children[0];
    this.removeButton = this.root.children[0].children[1];
    this.create(thumbObject, createFromRecord);
    this.root.id = this.id;
    this.image.setAttribute("tags", this.tagsString);

    if (userIsOnTheirOwnFavoritesPage()) {
      this.removeButton.onclick = (event) => {
        event.stopPropagation();
        ThumbNode.setIdToBeRemovedOnReload(this.id);
        fetch(this.removeURL);
        this.removeButton.remove();
      };
    }
    this.postTags = new PostTags(this.tagsString);

    if (usingRenderer()) {
      this.container.setAttribute("href", this.href);
    } else {
      this.container.onclick = () => {
        window.open(this.href, "_blank");
      };
    }
  }

  /**
   * @param {HTMLElement | {id: String, tags: String, src: String, type: String}} thumbObject
   * @param {Boolean} createFromRecord
   */
  create(thumbObject, createFromRecord) {
    if (createFromRecord) {
      this.createFromDatabaseRecord(thumbObject);
    } else {
      this.createFromHTMLElement(thumbObject);
    }
  }

  /**
   * @param {{id: String, tags: String, src: String, type: String}} record
   */
  createFromDatabaseRecord(record) {
    this.image.src = ThumbNode.reconstructThumbnailSource(record.src, record.id);
    this.id = record.id;
    this.tagsString = record.tags;
    this.image.classList.add(record.type);
  }

  /**
   * @param {HTMLElement} thumbElement
   */
  createFromHTMLElement(thumbElement) {
    const imageElement = thumbElement.children[0].children[0];

    this.image.src = imageElement.src;
    this.id = ThumbNode.getIdFromThumbElement(thumbElement);
    this.tagsString = `${imageElement.title} ${this.id}`;
    this.image.classList.add(getContentType(this.tagsString));
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
}
