class DownloadRequest {
  /** @type {String} */
  id;
  /** @type {String} */
  url;
  /** @type {String} */
  extension;

  /** @type {String} */
  get filename() {
    return `${this.id}.${this.extension}`;
  }

  /**
   * @param {String} id
   * @param {String} url
   * @param {String} extension
   */
  constructor(id, url, extension) {
    this.id = id;
    this.url = url;
    this.extension = extension;
  }

  /**
   * @returns {Promise<Blob>}
   */
  async blob() {
    const response = await fetch(this.url);
    return response.blob();
  }
}
