const THUMB_NODE_TEMPLATE = new DOMParser().parseFromString("<div></div>", "text/html").createElement("div");
const CANVAS_HTML = getPerformanceProfile() > 0 ? "" : "<canvas></canvas>";

THUMB_NODE_TEMPLATE.className = "thumb-node";
THUMB_NODE_TEMPLATE.innerHTML = `
    <div>
      <img loading="lazy">
      <button class="remove-button light-green-gradient" style="visibility: hidden;">Remove</button>
      ${CANVAS_HTML}
    </div>
`;

class ThumbNode {
  static baseURLs = {
    post: "https://rule34.xxx/index.php?page=post&s=view&id=",
    remove: "https://rule34.xxx/index.php?page=favorites&s=delete&id="
  };
  static thumbSourceExtractionRegex = /thumbnails\/\/([0-9]+)\/thumbnail_([0-9a-f]+)/;

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
    const elementWithId = onPostPage() ? thumb : thumb.children[0];
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
  tags;
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
    return this.tags.split(" ");
  }

  /**
   * @type {{id: String, tags: String, src: String}}
   */
  get databaseRecord() {
    return {
      id: this.id,
      tags: this.tags,
      src: this.compressedThumbSource
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
  }

  instantiateTemplate() {
    this.root = THUMB_NODE_TEMPLATE.cloneNode(true);
    this.container = this.root.children[0];
    this.image = this.root.children[0].children[0];
    this.removeButton = this.root.children[0].children[1];
  }

  setupRemoveButton() {
    if (userIsOnTheirOwnFavoritesPage()) {
      this.removeButton.onclick = (event) => {
        event.stopPropagation();
        setIdToBeRemovedOnReload(this.id);
        fetch(this.removeURL);
        this.removeButton.remove();
      };
    }
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
    this.image.setAttribute("tags", this.tags);
    this.postTags = new PostTags(this.tags);
  }

  /**
   * @param {{id: String, tags: String, src: String, type: String}} record
   */
  createFromDatabaseRecord(record) {
    this.image.src = ThumbNode.decompressThumbSource(record.src, record.id);
    this.id = record.id;
    this.tags = record.tags;
    this.image.classList.add(record.type);
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
    this.tags = `${correctMisspelledTags(imageElement.title)} ${this.id}`;
    this.image.classList.add(getContentType(this.tags));
  }

  setupOnClickLink() {
    if (usingRenderer()) {
      this.container.setAttribute("href", this.href);
    } else {
      this.container.onclick = () => {
        window.open(this.href, "_blank");
      };
      this.container.addEventListener("mousedown", (event) => {
        const middleClick = 1;

        if (event.button === middleClick) {
          event.preventDefault();
          window.open(this.href, "_blank");
        }
      });
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
}
