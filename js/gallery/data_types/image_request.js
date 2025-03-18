class ImageRequest {
  /** @type {String} */
  id;
  /** @type {ImageBitmap | null} */
  imageBitmap;
  /** @type {AbortController} */
  abortController;
  /** @type {Boolean} */
  cancelled;
  /** @type {Boolean} */
  isImage;
  /** @type {Boolean} */
  isLowResolution;
  /** @type {HTMLElement} */
  thumb;
  /** @type {String | null} */
  accentColor;

  /** @type {Boolean} */
  get hasCompleted() {
    return this.imageBitmap instanceof ImageBitmap;
  }

  /** @type {Boolean} */
  get isIncomplete() {
    return !this.hasCompleted;
  }

  /** @type {Number} */
  get megabytes() {
    return Post.getPixelCount(this.id) / 220000;
  }

  /** @type {Boolean} */
  get isAnimated() {
    return !this.isImage;
  }

  /** @type {Boolean} */
  get isOriginalResolution() {
    return !this.isLowResolution;
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
    this.isLowResolution = false;
    this.thumb = thumb;
    this.accentColor = null;
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

  markAsLowResolution() {
    this.isLowResolution = true;
  }

  abortIfCancelled() {
    if (this.cancelled) {
      this.abortController.abort();
      throw new ImageBitmapRequestCancelledError();
    }
  }

  close() {
    if (this.imageBitmap instanceof ImageBitmap) {
      this.imageBitmap.close();
    }
  }

  /**
   * @returns {Promise<void>}
   */
  start() {
    this.createAccentColor();
    return this.createImageBitmap();
  }

  createAccentColor() {
    if (GallerySettings.createImageAccentColors) {
      Utils.getMedianHexColor(this.thumb)
        .then((color) => {
          this.accentColor = color;
        });
    }
  }

  /**
   * @returns {Promise<void>}
   */
  createImageBitmap() {
    return ImageUtils.getOriginalImageURLWithExtension(this.thumb)
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

  /**
   * @returns {Promise<UpscaleRequest>}
   */
  async getUpscaleRequest() {
    if (!(this.imageBitmap instanceof ImageBitmap)) {
      throw new Error("Tried to create upscale request without image bitmap");
    }
    const imageBitmapClone = await createImageBitmap(this.imageBitmap);
    return new UpscaleRequest(this.thumb, imageBitmapClone);
  }
}
