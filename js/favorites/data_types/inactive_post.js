class InactivePost {
  /** @type {String} */
  id;
  /** @type {String} */
  tags;
  /** @type {String} */
  src;
  /** @type {FavoritesDatabaseMetadataRecord | null} */
  metadata;
  /** @type {Boolean} */
  createdFromDatabaseRecord;

  /**
   * @param {HTMLElement | FavoritesDatabaseRecord} favorite
   */
  constructor(favorite) {
    this.id = "";
    this.tags = "";
    this.src = "";
    this.metadata = null;
    this.createdFromDatabaseRecord = false;

    if (favorite instanceof HTMLElement) {
      this.populateAttributesFromHTMLElement(favorite);
    } else {
      this.createdFromDatabaseRecord = true;
      this.populateAttributesFromDatabaseRecord(favorite);
    }
  }

  /**
   * @param {FavoritesDatabaseRecord} record
   */
  populateAttributesFromDatabaseRecord(record) {
    this.id = record.id;
    this.tags = record.tags;
    this.src = ImageUtils.decompressThumbnailSource(record.src, record.id);
    this.metadata = record.metadata === undefined ? null : JSON.parse(record.metadata);
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

    this.src = ImageUtils.cleanThumbnailSource(source, this.id);
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

  createMetadata() {
    if (this.createdFromDatabaseRecord) {
      return new PostMetadata(this.id, this.metadata || null);
    }
    const favoritesMetadata = new PostMetadata(this.id, undefined);
    return favoritesMetadata;
  }
}
