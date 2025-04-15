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
  async createImageBitmap() {
    let imageURL = await ImageUtils.getOriginalImageURLWithExtension(this.thumb);

    imageURL = imageURL.replace(".mp4", ".jpg");
    this.abortIfCancelled();
    let response = await fetch(imageURL, {
      signal: this.abortController.signal
    });

    this.abortIfCancelled();

    if (!response.ok) {
      if (response.status === 404) {
        const extension = await ImageUtils.tryAllPossibleExtensions(this.thumb);

        imageURL = imageURL.replace(FavoritesSettings.defaultMediaExtension, extension);
        response = await fetch(imageURL, {
          signal: this.abortController.signal
        });
        this.abortIfCancelled();
        Extensions.set(this.id, extension);
      } else {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
    }
    const blob = await response.blob();

    this.abortIfCancelled();
    this.imageBitmap = await createImageBitmap(blob);
  }

  /**
   * @returns {Promise<ImageBitmap | null>}
   */
  getImageBitmapClone() {
    if (GallerySettings.fetchImageBitmapsInWorker) {
      return Promise.resolve(null);
    }

    if (!(this.imageBitmap instanceof ImageBitmap)) {
      throw new Error("Tried to create upscale request without image bitmap");
    }
    return createImageBitmap(this.imageBitmap);
  }
  /**
   * @returns {Promise<UpscaleRequest>}
   */
  async getUpscaleRequest() {
    const imageBitmapClone = await this.getImageBitmapClone();
    const imageURL = (await ImageUtils.getOriginalImageURLWithExtension(this.thumb)).replace(".mp4", ".jpg");
    return new UpscaleRequest(this.thumb, imageBitmapClone, imageURL);
  }
}
