class InactivePost {
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
  createdFromDatabaseRecord;

  /**
   * @param {HTMLElement | {id: String, tags: String, src: String, metadata: String}} favorite
   */
  constructor(favorite) {
    this.id = "";
    this.tags = "";
    this.src = "";
    this.metadata = "";
    this.createdFromDatabaseRecord = false;

    if (favorite instanceof HTMLElement) {
      this.populateAttributesFromHTMLElement(favorite);
    } else {
      this.createdFromDatabaseRecord = true;
      this.populateAttributesFromDatabaseRecord(favorite);
    }
  }

  /**
   * @param {{id: String, tags: String, src: String, metadata: String}} record
   */
  populateAttributesFromDatabaseRecord(record) {
    this.id = record.id;
    this.tags = record.tags;
    this.src = Utils.decompressThumbnailSource(record.src, record.id);
    this.metadata = record.metadata;
  }

  /**
   * @param {HTMLElement} element
   */
  populateAttributesFromHTMLElement(element) {
    this.id = Utils.getIdFromThumb(element);
    const image = Utils.getImageFromThumb(element);

    if (image === null) {
      return;
    }
    const source = image.src || image.getAttribute("data-cfsrc") || "";

    this.src = Utils.cleanThumbnailSource(source, this.id);
    this.tags = this.preprocessTags(image);
  }

  /**
   * @param {HTMLImageElement | null} image
   * @returns {String}
   */
  preprocessTags(image) {
    if (image === null) {
      return "";
    }
    const tags = image.title || image.getAttribute("tags") || "";
    return Utils.removeExtraWhiteSpace(tags).split(" ").sort().join(" ");
  }

  instantiateMetadata() {
    if (this.createdFromDatabaseRecord) {
      return new PostMetadata(this.id, this.metadata || null);
    }
    const favoritesMetadata = new PostMetadata(this.id, undefined);
    return favoritesMetadata;
  }
}
