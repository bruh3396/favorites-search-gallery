class GalleryImageCreator {
  /**
   * @type {Map<String, ImageRequest>}
   */
  imageRequests;
  /**
   * @type {Set<String>}
   */
  animatedRequestIds;
  /**
   * @type {Function}
   */
  onImageCreated;

  /**
   * @param {Function} onImageCreated
   */
  constructor(onImageCreated) {
    this.onImageCreated = onImageCreated;
    this.imageRequests = new Map();
    this.animatedRequestIds = new Set();
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {ImageRequest | undefined}
   */
  getImageRequest(thumb) {
    return this.imageRequests.get(thumb.id);
  }

  /**
   * @param {ImageRequest} request
   */
  completeImageRequest(request) {
    if (this.imageRequests.has(request.id) && request.isImage) {
      this.imageRequests.set(request.id, request);
    }
    this.onImageCreated(request);
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  createNewImages(thumbs) {
    const finalRequests = this.getFinalImageRequests(thumbs);

    this.deleteOutdatedImages(finalRequests);
    this.createImages(this.removeAlreadyCreatedImages(finalRequests));
  }

  /**
   * @param {HTMLElement[]} thumbs
   * @returns {ImageRequest[]}
   */
  getFinalImageRequests(thumbs) {
    const requests = thumbs.map(thumb => new ImageRequest(thumb));
    return this.truncateImageRequests(requests);
  }

  /**
   * @param {ImageRequest[]} requests
   * @returns {ImageRequest[]}
   */
  truncateImageRequests(requests) {
    if (Flags.onFavoritesPage) {
      return this.truncateImagesExceedingMemoryLimit(requests);
    }
    return this.truncateImagesOnSearchPage(requests);
  }

  /**
   * @param {ImageRequest[]} requests
   * @returns {ImageRequest[]}
   */
  truncateImagesExceedingMemoryLimit(requests) {
    const truncatedRequests = [];
    let accumulatedMegabytes = 0;

    for (const request of requests) {
      accumulatedMegabytes += request.isImage ? request.megabytes : 0;
      const underMemoryLimit = accumulatedMegabytes < GallerySettings.imageMegabyteLimit;
      const underMinimumThumbCount = truncatedRequests.length < GallerySettings.minimumPreloadedImageCount;

      if (underMemoryLimit || underMinimumThumbCount) {
        truncatedRequests.push(request);
      } else {
        break;
      }
    }
    return truncatedRequests;
  }

  /**
   * @param {ImageRequest[]} requests
   * @returns {ImageRequest[]}
   */
  truncateImagesOnSearchPage(requests) {
    return requests.slice(0, GallerySettings.searchPagePreloadedImageCount)
    .filter(request => !request.isAnimated);
  }

  /**
   * @param {ImageRequest[]} requests
   */
  deleteOutdatedImages(requests) {
    const idsToCreate = new Set(requests.map(thumb => thumb.id));

    for (const [id, request] of this.imageRequests.entries()) {
      if (!idsToCreate.has(id)) {
        request.cancel();
        this.imageRequests.delete(id);
      }
    }
  }

  /**
   * @param {ImageRequest[]} requests
   */
  removeAlreadyCreatedImages(requests) {
    return requests
      .filter(request => !this.animatedRequestIds.has(request.id) && !this.imageRequests.has(request.id));
  }

  /**
   * @param {ImageRequest[]} requests
   */
  async createImages(requests) {
    for (const request of requests) {
      this.createImage(request);
      await Utils.sleep(40);
    }
  }

  /**
   * @param {ImageRequest} request
   */
  createImage(request) {
    if (request.cancelled) {
      return;
    }
    this.saveRequest(request);
    request.start()
      .then(() => {
        this.completeImageRequest(request);
      })
      .catch((error) => {
        if (error instanceof ImageBitmapRequestCancelled) {
          this.imageRequests.delete(request.id);
          return;
        }
        throw error;
      });
  }

  /**
   * @param {ImageRequest} request
   */
  saveRequest(request) {
    if (request.isImage) {
      this.imageRequests.set(request.id, request);
    } else {
      this.animatedRequestIds.add(request.id);
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  createLowResolutionImage(thumb) {
    const image = Utils.getImageFromThumb(thumb);

    if (image === null) {
      return;
    }
    const lowResolutionRequest = new ImageRequest(thumb);

    lowResolutionRequest.markAsLowResolution();
    createImageBitmap(image)
      .then((imageBitmap) => {
        const originalResolutionRequest = this.getImageRequest(thumb);

        if (originalResolutionRequest === undefined || originalResolutionRequest.isIncomplete) {
          lowResolutionRequest.complete(imageBitmap);
          this.completeImageRequest(lowResolutionRequest);
        }
      });
  }

  clearAllImages() {
    for (const [id, request] of this.imageRequests.entries()) {
      request.close();
      this.imageRequests.delete(id);
    }
    this.imageRequests.clear();
    this.clearAnimatedImages();
  }

  clearAnimatedImages() {
    this.animatedRequestIds.clear();
  }

  /**
   * @returns {ImageRequest[]}
   */
  getImageRequests() {
    return Array.from(this.imageRequests.values());
  }
}
