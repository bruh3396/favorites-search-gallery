class InactivePost {
  /**
   * @param {String} compressedSource
   * @param {String} id
   * @returns {String}
   */
  static decompressThumbnailSource(compressedSource, id) {
    const splitSource = compressedSource.split("_");
    return `https://us.rule34.xxx/thumbnails//${splitSource[0]}/thumbnail_${splitSource[1]}.jpg?${id}`;
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
  createdFromDatabaseRecord;

  /**
   * @param {HTMLElement | {id: String, tags: String, src: String, metadata: String}} favorite
   * @param {Boolean} createFromRecord
   */
  constructor(favorite, createFromRecord) {
    this.id = "";
    this.tags = "";
    this.src = "";
    this.metadata = "";
    this.createdFromDatabaseRecord = createFromRecord;

    if (createFromRecord) {
      this.populateAttributesFromDatabaseRecord(favorite);
    } else {
      this.populateAttributesFromHTMLElement(favorite);
    }
  }

  /**
   * @param {{id: String, tags: String, src: String, metadata: String}} record
   */
  populateAttributesFromDatabaseRecord(record) {
    this.id = record.id;
    this.tags = record.tags;
    this.src = InactivePost.decompressThumbnailSource(record.src, record.id);
    this.metadata = record.metadata;
  }

  /**
   * @param {HTMLElement} element
   */
  populateAttributesFromHTMLElement(element) {
    this.id = Utils.getIdFromThumb(element);
    const image = Utils.getImageFromThumb(element);

    this.src = image.src || image.getAttribute("data-cfsrc") || "";
    this.tags = this.preprocessTags(image);
  }

  /**
   * @param {HTMLImageElement} image
   * @returns {String}
   */
  preprocessTags(image) {
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
