class ImageRequest {
  /**
   * @type {String}
   */
  id;
  /**
   * @type {ImageBitmap | null}
   */
  imageBitmap;
  /**
   * @type {AbortController}
   */
  abortController;
  /**
   * @type {Boolean}
   */
  cancelled;
  /**
   * @type {Boolean}
   */
  isImage;
  /**
   * @type {HTMLElement}
   */
  thumb;

  /**
   * @type {Boolean}
   */
  get hasCompleted() {
    return this.imageBitmap instanceof ImageBitmap;
  }

  /**
   * @type {Boolean}
   */
  get isIncomplete() {
    return !this.hasCompleted;
  }

  /**
   * @type {Number}
   */
  get megabytes() {
    return Post.getPixelCount(this.id) / 220000;
  }

  /**
   * @type {Boolean}
   */
  get isAnimated() {
    return !this.isImage;
  }

  /**
   * @param {HTMLElement} thumb
   */
  constructor(thumb) {
    this.id = thumb.id;
    this.imageBitmap = null;
    this.abortController = new AbortController();
    this.cancelled = false;
    this.isImage = Utils.isImage(thumb);
    this.thumb = thumb;
  }

  /**
   * @param {ImageBitmap} imageBitmap
   */
  complete(imageBitmap) {
    this.imageBitmap = imageBitmap;
  }

  cancel() {
    this.cancelled = true;
  }

  abortIfCancelled() {
    if (this.cancelled) {
      this.abortController.abort();
      throw new ImageBitmapRequestCancelled();
    }
  }

  close() {
    if (this.imageBitmap instanceof ImageBitmap) {
      this.imageBitmap.close();
    }
  }

  /**
   * @returns {Promise.<void>}
   */
  start() {
    return Utils.getOriginalImageURLWithExtension(this.thumb)
    .then((url) => {
      url = url.replace(".mp4", ".jpg");
      this.abortIfCancelled();
      return fetch(url, {
        signal: this.abortController.signal
      });
    })
    .then((response) => {
      this.abortIfCancelled();
      return response.blob();
    })
    .then((blob) => {
      this.abortIfCancelled();
      return createImageBitmap(blob);
    })
    .then((imageBitmap) => {
      this.imageBitmap = imageBitmap;
    });
  }
}
