class FavoriteMetadata {
  static parser = new DOMParser();

  /**
   * @type {Number}
  */
  id;
  /**
   * @type {Number}
  */
  width;
  /**
   * @type {Number}
  */
  height;
  /**
   * @type {Number}
  */
  score;
  /**
   * @type {String}
  */
  rating;
  /**
   * @type {Number}
  */
  creationTimestamp;
  /**
   * @type {Number}
  */
  lastChangedTimestamp;
  /**
   * @type {Boolean}
  */
  postIsDeleted;

  /**
   * @returns {String}
  */

  get apiURL() {
    return `https://api.rule34.xxx//index.php?page=dapi&s=post&q=index&id=${this.id}`;
  }

  /**
   * @returns {String}
   */
  get json() {
    return JSON.stringify({
      width: this.width,
      height: this.height,
      score: this.score,
      rating: this.rating,
      create: this.creationTimestamp,
      change: this.lastChangedTimestamp,
      deleted: this.postIsDeleted
    });
  }

  /**
   * @param {String} id
   * @param {Object.<String, String>} record
   */
  constructor(id, record) {
    this.id = parseInt(id);
    this.setDefaults();
    this.populateMetadata(record);
  }

  setDefaults() {
    this.width = 0;
    this.height = 0;
    this.score = 0;
    this.creationTimestamp = 0;
    this.lastChangedTimestamp = 0;
    this.rating = "e";
    this.postIsDeleted = false;
  }

  /**
   * @param {Object.<String, String>} record
   */
  populateMetadata(record) {
    if (record === undefined) {
      this.populateMetadataFromAPI();
    } else {
      this.populateMetadataFromRecord(JSON.parse(record));

      if (this.metadataIsEmpty()) {
        this.populateMetadataFromAPI();
      }
    }
  }

  populateMetadataFromAPI() {
    fetch(this.apiURL)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        const dom = FavoriteMetadata.parser.parseFromString(html, "text/html");
        const metadata = dom.querySelector("post");

        if (metadata === null) {
          throw new Error(`deleted: ${this.apiURL}`);
        }
        this.width = parseInt(metadata.getAttribute("width"));
        this.height = parseInt(metadata.getAttribute("height"));
        this.score = parseInt(metadata.getAttribute("score"));
        this.rating = metadata.getAttribute("rating");
        this.creationTimestamp = Date.parse(metadata.getAttribute("created_at"));
        this.lastChangedTimestamp = parseInt(metadata.getAttribute("change"));

        const extension = this.getExtensionFromFileURL(metadata.getAttribute("file_url"));

        if (extension !== "mp4") {
          dispatchEvent(new CustomEvent("favoriteMetadataFetched", {
            detail: {
              id: this.id,
              extension
            }
          }));
        }
      })
      .catch((error) => {
        if (!error.message.startsWith("deleted")) {
          this.postIsDeleted = true;
        }
      });
  }

  /**
   * @param {Object.<String, String>} record
  */
  populateMetadataFromRecord(record) {
    this.width = record.width;
    this.height = record.height;
    this.score = record.score;
    this.rating = record.rating;
    this.creationTimestamp = record.create;
    this.lastChangedTimestamp = record.change;
    this.postIsDeleted = record.deleted;
  }

  /**
   * @returns {Boolean}
   */
  metadataIsEmpty() {
    return this.width === 0 && !this.postIsDeleted;
  }

  /**
 * @param {String} imageURL
 * @returns {String}
 */
  getExtensionFromFileURL(imageURL) {
    try {
      return (/\.(png|jpg|jpeg|gif|mp4)/g).exec(imageURL)[1];

    } catch (error) {
      return "jpg";
    }
  }
}
