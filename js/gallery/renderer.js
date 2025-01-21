class Renderer {
  /**
   * @type {HTMLCanvasElement}
   */
  mainCanvas;
  /**
   * @type {HTMLCanvasElement}
   */
  lowResolutionCanvas;
  /**
   * @type {CanvasRenderingContext2D}
   */
  lowResolutionContext;
  /**
   * @type {Worker}
   */
  imageRenderer;
  /**
   * @type {Set.<String>}
   */
  startedRenders;
  /**
   * @type {Set.<String>}
   */
  completedRenders;
  /**
   * @type {Map.<String, HTMLCanvasElement>}
   */
  transferredCanvases;
  /**
   * @type {Number}
   */
  currentBatchRenderRequestId;
  /**
   * @type {String}
   */
  lastRequestedRenderId;

  constructor() {
    this.initializeFields();
    this.extractElements();
    this.setCanvasResolutions();
    this.createWebWorker();
    this.setOrientation();
    this.createImageRendererMessageHandler();
  }

  initializeFields() {
    this.startedRenders = new Set();
    this.completedRenders = new Set();
    this.transferredCanvases = new Map();
    this.lastRequestedRenderId = "";
  }

  extractElements() {
    this.mainCanvas = document.getElementById("main-canvas");
    this.lowResolutionCanvas = document.getElementById("low-resolution-canvas");
    this.lowResolutionContext = this.lowResolutionCanvas.getContext("2d");
  }

  setCanvasResolutions() {
    const resolution = Utils.onSearchPage() ? Gallery.canvasResolutions.search : Gallery.canvasResolutions.favorites;
    const dimensions = resolution.split("x").map(dimension => parseFloat(dimension));

    this.mainCanvas.width = dimensions[0];
    this.mainCanvas.height = dimensions[1];
    this.lowResolutionCanvas.width = Utils.onMobileDevice() ? 320 : 1280;
    this.lowResolutionCanvas.height = Utils.onMobileDevice() ? 180 : 720;
  }

  createWebWorker() {
    const offscreenCanvas = this.mainCanvas.transferControlToOffscreen();

    this.imageRenderer = new Worker(Utils.getWorkerURL(WebWorkers.webWorkers.renderer));
    this.imageRenderer.onmessage = (message) => {
      message = message.data;

      switch (message.action) {
        case "renderCompleted":
          this.onRenderCompleted(message);
          break;

        case "renderDeleted":
          this.onRenderDeleted(message);
          break;

        case "extensionFound":
          Utils.assignImageExtension(message.id, message.extension);
          break;

        default:
          break;
      }
    };
    this.imageRenderer.postMessage({
      action: "initialize",
      canvas: offscreenCanvas,
      onMobileDevice: Utils.onMobileDevice(),
      screenWidth: window.screen.width,
      megabyteLimit: Gallery.settings.megabyteLimit,
      minimumImagesToRender: Gallery.settings.minImagesToRender,
      onSearchPage: Utils.onSearchPage()
    }, [offscreenCanvas]);
  }

  setOrientation() {
    if (!Utils.onMobileDevice() || this.imageRenderer === null || this.imageRenderer === undefined) {
      return;
    }
    const usingLandscapeOrientation = window.screen.orientation.angle === 90;

    this.setOrientationHelper(usingLandscapeOrientation);
    this.swapMainCanvasDimensions(usingLandscapeOrientation);
    this.swapLowResolutionCanvasDimensions(usingLandscapeOrientation);
    this.redrawCanvasesOnOrientationChange();
  }

  /**
   * @param {HTMLElement} thumb
   */
  drawMainCanvas(thumb) {
    this.lastRequestedRenderId = thumb.id;
    this.imageRenderer.postMessage({
      action: "drawMainCanvas",
      id: thumb.id
    });
  }

  /**
   * @param {String} id
   */
  drawLowResolutionCanvas(thumb) {
    const image = Utils.getImageFromThumb(thumb);

    if (!Utils.imageIsLoaded(image)) {
      return;
    }
    const ratio = Math.min(this.lowResolutionCanvas.width / image.naturalWidth, this.lowResolutionCanvas.height / image.naturalHeight);
    const centerShiftX = (this.lowResolutionCanvas.width - (image.naturalWidth * ratio)) / 2;
    const centerShiftY = (this.lowResolutionCanvas.height - (image.naturalHeight * ratio)) / 2;

    this.clearLowResolutionCanvas();
    this.lowResolutionContext.drawImage(
      image, 0, 0, image.naturalWidth, image.naturalHeight,
      centerShiftX, centerShiftY, image.naturalWidth * ratio, image.naturalHeight * ratio
    );
  }

  clearMainCanvas() {
    this.imageRenderer.postMessage({
      action: "clearMainCanvas"
    });
  }

  clearLowResolutionCanvas() {
    this.lowResolutionContext.clearRect(0, 0, this.lowResolutionCanvas.width, this.lowResolutionCanvas.height);
  }

  clearCanvases() {
    this.mainCanvas.style.visibility = "hidden";
    this.lowResolutionCanvas.style.visibility = "hidden";
  }

  /**
   * @param {HTMLElement[]} imagesToRender
   */
  renderImages(imagesToRender) {
    const renderRequests = imagesToRender.map(image => this.getRenderRequest(image));
    const canvases = Utils.onSearchPage() ? [] : renderRequests
      .filter(request => request.canvas !== undefined)
      .map(request => request.canvas);

    this.imageRenderer.postMessage({
      action: "renderMultiple",
      id: this.currentBatchRenderRequestId,
      renderRequests,
      requestType: "none"
    }, canvases);
    this.currentBatchRenderRequestId += 1;

    if (this.currentBatchRenderRequestId >= 1000) {
      this.currentBatchRenderRequestId = 0;
    }
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {{
   *  action: String,
   *  imageURL: String,
   *  id: String,
   *  extension: String,
   *  fetchDelay: Number,
   *  thumbURL: String,
   *  pixelCount: Number,
   *  canvas: OffscreenCanvas
   *  resolutionFraction: Number
   *  windowDimensions: {width: Number, height:Number}
   * }}
   */
  getRenderRequest(thumb) {
    const request = {
      action: "render",
      imageURL: Utils.getOriginalImageURLFromThumb(thumb),
      id: thumb.id,
      extension: Utils.getImageExtension(thumb.id),
      fetchDelay: this.getBaseImageFetchDelay(thumb.id),
      thumbURL: Utils.getImageFromThumb(thumb).src.replace("us.rule", "rule"),
      pixelCount: this.getPixelCount(thumb),
      resolutionFraction: Gallery.settings.upscaledThumbResolutionFraction
    };

    this.startedRenders.add(thumb.id);

    if (this.canvasIsTransferrable(thumb)) {
      request.canvas = this.getOffscreenCanvasFromThumb(thumb);
    }

    if (Utils.onMobileDevice()) {
      request.windowDimensions = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
    return request;
  }

  /**
   * @param {String} id
   * @returns {Number}
   */
  getBaseImageFetchDelay(id) {
    if (Utils.onFavoritesPage() && !Gallery.finishedLoading) {
      return Gallery.settings.throttledImageFetchDelay;
    }

    if (Utils.extensionIsKnown(id)) {
      return Gallery.settings.imageFetchDelayWhenExtensionKnown;
    }
    return Gallery.settings.imageFetchDelay;
  }

  /**
   * @param {HTMLElement[]} animatedThumbs
   */
  upscaleAnimatedThumbs(animatedThumbs) {
    if (Utils.onMobileDevice()) {
      return;
    }
    const upscaleRequests = [];

    for (const thumb of animatedThumbs) {
      if (!this.canvasIsTransferrable(thumb)) {
        continue;
      }
      let imageURL = Utils.getOriginalImageURL(Utils.getImageFromThumb(thumb).src);

      if (Utils.isGif(thumb)) {
        imageURL = imageURL.replace("jpg", "gif");
      }
      upscaleRequests.push({
        id: thumb.id,
        imageURL,
        canvas: this.getOffscreenCanvasFromThumb(thumb),
        resolutionFraction: Gallery.settings.upscaledAnimatedThumbResolutionFraction
      });
    }

    this.imageRenderer.postMessage({
      action: "upscaleAnimatedThumbs",
      upscaleRequests
    }, upscaleRequests.map(request => request.canvas));
  }

  /**
   * @param {HTMLElement} thumb
   */
  upscaleAnimatedThumbsAround(thumb) {
    if (!Utils.onFavoritesPage() || Utils.onMobileDevice()) {
      return;
    }
    const animatedThumbsToUpscale = ThumbSelector.getAdjacentThumbs(thumb, Gallery.settings.animatedThumbsToUpscaleRange, (t) => {
      return !Utils.isImage(t) && !this.transferredCanvases.has(t.id);
    });

    this.upscaleAnimatedThumbs(animatedThumbsToUpscale);
  }

  /**
   * @param {HTMLElement} thumb
   */
  upscaleAnimatedThumbsAroundDiscrete(thumb) {
    if (!Utils.onFavoritesPage() || Utils.onMobileDevice()) {
      return;
    }
    const animatedThumbsToUpscale = ThumbSelector.getAdjacentThumbs(thumb, Gallery.settings.animatedThumbsToUpscaleDiscrete, (_) => {
      return true;
    }).filter(t => !Utils.isImage(t) && !this.transferredCanvases.has(t.id));

    this.upscaleAnimatedThumbs(animatedThumbsToUpscale);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {HTMLCanvasElement}
   */
  getOffscreenCanvasFromThumb(thumb) {
    const canvas = this.getCanvasFromThumb(thumb);

    this.transferredCanvases.set(thumb.id, canvas);
    return canvas.transferControlToOffscreen();
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {HTMLCanvasElement}
   */
  getCanvasFromThumb(thumb) {
    let canvas = thumb.querySelector("canvas");

    if (canvas === null) {
      canvas = document.createElement("canvas");
      thumb.children[0].appendChild(canvas);
    }
    return canvas;
  }

  deleteAllTransferredCanvases() {
    if (Utils.onSearchPage()) {
      return;
    }

    for (const id of this.transferredCanvases.keys()) {
      this.transferredCanvases.get(id).remove();
      this.transferredCanvases.delete(id);
    }
    this.transferredCanvases.clear();
  }

  deleteAllRenders() {
    this.startedRenders.clear();
    this.completedRenders.clear();
    this.deleteAllTransferredCanvases();
    this.imageRenderer.postMessage({
      action: "deleteAllRenders"
    });

    if (Gallery.settings.debugEnabled) {
      if (Gallery.settings.loopAtEndOfGallery) {
        for (const thumb of Gallery.visibleThumbs) {
          thumb.classList.remove("loaded");
        }
      } else {
        for (const post of Post.allPosts.values()) {
          if (post.root !== undefined) {
            post.root.classList.remove("loaded");
          }
        }
      }
    }
  }

  onRenderDeleted(message) {
    const thumb = document.getElementById(message.id);

    if (thumb !== null) {
      if (Gallery.settings.debugEnabled) {
        thumb.classList.remove("loaded");
      }
    }
    this.startedRenders.delete(message.id);
    this.completedRenders.delete(message.id);
  }

  /**
   * @param {Object} message
   */
  onRenderCompleted(message) {
    const thumb = document.getElementById(message.id);

    this.completedRenders.add(message.id);

    if (Gallery.settings.debugEnabled) {

      if (Gallery.settings.loopAtEndOfGallery) {
        if (thumb !== null) {
          thumb.classList.add("loaded");
        }
      } else {
        const post = Post.allPosts.get(message.id);

        if (post !== undefined && post.root !== undefined) {
          post.root.classList.add("loaded");
        }
      }
    }

    if (thumb !== null && message.extension === "gif") {
      Utils.getImageFromThumb(thumb).setAttribute("gif", true);
    } else {
      Utils.assignImageExtension(message.id, message.extension);
    }
  }

  renderImagesInTheBackground() {
    if (Utils.onMobileDevice()) {
      return;
    }
    const thumbs = Utils.getAllThumbs();

    if (Utils.onSearchPage()) {
      this.renderImages(thumbs.filter(thumb => Utils.isImage(thumb)).slice(0, 50));
      return;
    }
    const animatedThumbs = thumbs
      .slice(0, Gallery.settings.animatedThumbsToUpscaleDiscrete)
      .filter(thumb => !Utils.isImage(thumb));

    if (thumbs.length > 0) {
      this.upscaleAnimatedThumbs(animatedThumbs);
      this.renderImagesAround(thumbs[0]);
    }
  }

  /**
   * @param {HTMLElement} initialThumb
   */
  renderImagesAround(initialThumb) {
    // if (Utils.onSearchPage() || (Utils.onMobileDevice() && !this.enlargeOnClickOnMobile)) {
    if (Utils.onSearchPage() || (Utils.onMobileDevice())) {
      return;
    }
    this.renderImages(this.getAdjacentImageThumbs(initialThumb));
  }

  /**
   * @param {HTMLElement} initialThumb
   * @returns {HTMLElement[]}
   */
  getAdjacentImageThumbs(initialThumb) {
    const adjacentImageThumbs = Utils.isImage(initialThumb) ? [initialThumb] : [];

    if (Gallery.settings.loopAtEndOfGallery || ThumbSelector.latestSearchResults.length === 0) {
      return adjacentImageThumbs.concat(ThumbSelector.getAdjacentImageThumbsOnCurrentPage(initialThumb));
    }
    return adjacentImageThumbs.concat(ThumbSelector.getAdjacentImageThumbsThroughoutAllPages(initialThumb));
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Boolean}
   */
  renderHasStarted(thumb) {
    return this.startedRenders.has(thumb.id);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Boolean}
   */
  renderIsCompleted(thumb) {
    return this.completedRenders.has(thumb.id);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Boolean}
   */
  canvasIsTransferrable(thumb) {
    return !Utils.onMobileDevice() && !Utils.onSearchPage() && !this.transferredCanvases.has(thumb.id) && document.getElementById(thumb.id) !== null;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Number}
   */
  getPixelCount(thumb) {
    if (Utils.onSearchPage()) {
      return 0;
    }
    const defaultPixelCount = 2073600;
    const pixelCount = Post.getPixelCount(thumb.id);
    return pixelCount === 0 ? defaultPixelCount : pixelCount;
  }

  /**
   * @param {HTMLElement} thumb
   */
  renderOriginalImage(thumb) {
    if (Utils.onSearchPage()) {
      return;
    }

    if (this.canvasIsTransferrable(thumb)) {
      const request = this.getRenderRequest(thumb);

      this.imageRenderer.postMessage(request, [request.canvas]);
    } else {
      this.imageRenderer.postMessage(this.getRenderRequest(thumb));
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleMainCanvas(value) {
    if (value === undefined) {
      this.mainCanvas.style.visibility = this.mainCanvas.style.visibility === "visible" ? "hidden" : "visible";
      this.lowResolutionCanvas.style.visibility = this.mainCanvas.style.visibility === "visible" ? "hidden" : "visible";
    } else {
      this.mainCanvas.style.visibility = value ? "visible" : "hidden";
      this.lowResolutionCanvas.style.visibility = value ? "visible" : "hidden";
    }
  }

  /**
   * @param {Boolean} usingLandscapeOrientation
   */
  swapLowResolutionCanvasDimensions(usingLandscapeOrientation) {
    if (usingLandscapeOrientation === (this.lowResolutionCanvas.width > this.lowResolutionCanvas.height)) {
      return;
    }
    const temp = this.lowResolutionCanvas.height;

    this.lowResolutionCanvas.height = this.lowResolutionCanvas.width;
    this.lowResolutionCanvas.width = temp;
  }

  /**
   * @param {Boolean} usingLandscapeOrientation
   */
  swapMainCanvasDimensions(usingLandscapeOrientation) {
    this.imageRenderer.postMessage({
      action: "changeCanvasOrientation",
      usingLandscapeOrientation
    });
  }

  /**
   * @param {Boolean} usingLandscapeOrientation
   */
  setOrientationHelper(usingLandscapeOrientation) {
    const orientationId = "main-orientation";

    if (usingLandscapeOrientation) {
      Utils.insertStyleHTML(`
        #original-gif-container, #main-canvas, #low-resolution-canvas {
            height: 100vh !important;
            width: auto !important;
        }
        `, orientationId);
    } else {
      Utils.insertStyleHTML(`
        #original-gif-container, #main-canvas, #low-resolution-canvas {
            width: 100vw !important;
            height: auto !important;
        }
        `, orientationId);
    }
  }

  redrawCanvasesOnOrientationChange() {
    const thumb = document.getElementById(this.lastRequestedRenderId);

    if (this.lastRequestedRenderId === "" || thumb === undefined || thumb === null) {
      return;
    }
    this.drawLowResolutionCanvas(thumb);
    this.imageRenderer.postMessage(this.getRenderRequest(thumb));
  }

  async findImageExtensionsInTheBackground() {
    await Utils.sleep(1000);
    const idsWithUnknownExtensions = Utils.getIdsWithUnknownExtensions(Array.from(Post.allPosts.values()));

    while (idsWithUnknownExtensions.length > 0) {
      await Utils.sleep(3000);

      while (idsWithUnknownExtensions.length > 0 && Gallery.finishedLoading) {
        const id = idsWithUnknownExtensions.pop();

        if (id !== undefined && id !== null && !Utils.extensionIsKnown(id)) {
          this.imageRenderer.postMessage({
            action: "findExtension",
            id
          });
          await Utils.sleep(10);
        }
      }
    }
  }

  upscaleAllRenderedThumbs() {
    setTimeout(() => {
      this.imageRenderer.postMessage({
        action: "upscaleAllRenderedThumbs"
      });
    }, 100);
  }
}
