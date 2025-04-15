class PostData {
  /** @type {String} */
  id;
  /** @type {String} */
  tags;
  /** @type {String} */
  src;
  /** @type {FavoritesDatabaseMetadataRecord | null} */
  metadataRecord;
  /** @type {Boolean} */
  createdFromDatabaseRecord;
  /** @type {Boolean} */
  cleared;
  /** @type {String} */
  contentType;

  /** @type {Boolean} */
  get createdFromHTMLElement() {
    return !this.createdFromDatabaseRecord;
  }

  /**
   * @param {HTMLElement | FavoritesDatabaseRecord} object
   */
  constructor(object) {
    this.id = "";
    this.tags = "";
    this.src = "";
    this.metadataRecord = null;
    this.createdFromDatabaseRecord = false;
    this.cleared = false;

    if (object instanceof HTMLElement) {
      this.populateAttributesFromHTMLElement(object);
    } else {
      this.createdFromDatabaseRecord = true;
      this.populateAttributesFromDatabaseRecord(object);
    }
    this.contentType = Utils.getContentType(this.tags);
  }

  /**
   * @param {FavoritesDatabaseRecord} record
   */
  populateAttributesFromDatabaseRecord(record) {
    this.id = record.id;
    this.tags = record.tags;
    this.src = ImageUtils.decompressThumbnailSource(record.src, record.id);
    this.metadataRecord = record.metadata === undefined ? null : JSON.parse(record.metadata);
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

  /**
   * @returns {PostMetadata}
   */
  createMetadata() {
    if (this.createdFromHTMLElement) {
      return new PostMetadata(this.id, PostMetadata.emptyRecord, PostMetadata.statuses.NO_FAVORITE_RECORD);
    }

    if (this.metadataRecord === null) {
      return new PostMetadata(this.id, PostMetadata.emptyRecord, PostMetadata.statuses.HAS_FAVORITE_RECORD);
    }
    return new PostMetadata(this.id, this.metadataRecord, PostMetadata.statuses.HAS_METADATA_RECORD);
  }

  clearSearchProperties() {
    this.tags = "";
    this.metadataRecord = null;
  }

  clear() {
    this.id = "";
    this.tags = "";
    this.src = "";
    this.metadataRecord = null;
    this.cleared = true;
  }
}
