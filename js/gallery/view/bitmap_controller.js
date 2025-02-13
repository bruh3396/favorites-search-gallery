class GalleryImageBitmapController {
  /**
   * @type {Map.<String, ImageBitmap | null>}
   */
  imageBitmaps;
  /**
   * @type {Function}
   */
  onBitmapCreated;

  /**
   * @param {Function} onBitmapCreated
   */
  constructor(onBitmapCreated) {
    this.onBitmapCreated = onBitmapCreated;
    this.imageBitmaps = new Map();
  }

  /**
   * @param {String} id
   * @returns {ImageBitmap | null | undefined}
   */
  get(id) {
    return this.imageBitmaps.get(id);
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  createNewImageBitmaps(thumbs) {
    this.deleteOutdatedImageBitmaps(thumbs);
    this.createImageBitmaps(thumbs);
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  deleteOutdatedImageBitmaps(thumbs) {
    const idsToRender = new Set(thumbs.map(thumb => thumb.id));

    for (const id of this.imageBitmaps.keys()) {
      if (!idsToRender.has(id)) {
        this.delete(id);
      }
    }
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  createImageBitmaps(thumbs) {
    thumbs
      .filter(thumb => !this.imageBitmaps.has(thumb.id))
      .forEach(async(thumb) => {
        this.createImageBitmap(thumb);
        await Utils.sleep(100);
      });
  }

  /**
   * @param {HTMLElement} thumb
   */
  createImageBitmap(thumb) {
    this.imageBitmaps.set(thumb.id, null);
    return Utils.getOriginalImageURLWithExtension(thumb)
      .then((url) => {
        return fetch(url);
      })
      .then((response) => {
        return response.blob();
      })
      .then((blob) => {
        return createImageBitmap(blob);
      })
      .then((imageBitmap) => {
        if (this.imageBitmaps.has(thumb.id)) {
          this.imageBitmaps.set(thumb.id, imageBitmap);
        }
        this.onBitmapCreated(thumb, imageBitmap);
      });
  }

  clear() {
    for (const id of this.imageBitmaps.keys()) {
      this.delete(id);
    }
    this.imageBitmaps.clear();
  }

  /**
   * @param {String} id
   */
  delete(id) {
    const imageBitmap = this.imageBitmaps.get(id);

    if (imageBitmap instanceof ImageBitmap) {
      imageBitmap.close();
    }
    this.imageBitmaps.delete(id);
  }

}
