/* eslint-disable prefer-template */
/**
 * @param {Number} milliseconds
 * @returns {Promise.<any>}
 */
function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

class RenderRequest {
  /**
   * @type {String}
   */
  id;
  /**
   * @type {String}
   */
  imageURL;
  /**
   * @type {String}
   */
  extension;
  /**
   * @type {String}
   */
  thumbURL;
  /**
   * @type {String}
   */
  fetchDelay;
  /**
   * @type {Number}
   */
  pixelCount;
  /**
   * @type {OffscreenCanvas}
   */
  canvas;
  /**
   * @type {Number}
   */
  resolutionFraction;
  /**
   * @type {AbortController}
   */
  abortController;
  /**
   * @type {Number}
   */
  get estimatedMegabyteSize() {
    const rgb = 3;
    const bytes = rgb * this.pixelCount;
    const numberOfBytesInMegabyte = 1048576;
    return bytes / numberOfBytesInMegabyte;
  }

  /**
   * @param {{
   *  id: String,
   *  imageURL: String,
   *  extension: String,
   *  thumbURL: String,
   *  fetchDelay: String,
   *  pixelCount: Number,
   *  canvas: OffscreenCanvas,
   *  resolutionFraction: Number
   * }} request
   */
  constructor(request) {
    this.id = request.id;
    this.imageURL = request.imageURL;
    this.extension = request.extension;
    this.thumbURL = request.thumbURL;
    this.fetchDelay = request.fetchDelay;
    this.pixelCount = request.pixelCount;
    this.canvas = request.canvas;
    this.resolutionFraction = request.resolutionFraction;
    this.abortController = new AbortController();
  }
}

class BatchRenderRequest {
  static settings = {
    megabyteMemoryLimit: 1000,
    minimumRequestCount: 10
  };

  /**
   * @type {String}
   */
  id;
  /**
   * @type {String}
   */
  requestType;
  /**
   * @type {RenderRequest[]}
   */
  renderRequests;
  /**
   * @type {RenderRequest[]}
   */
  originalRenderRequests;

  get renderRequestIds() {
    return new Set(this.renderRequests.map(request => request.id));
  }

  /**
   * @param {{
   *  id: String,
   *  requestType: String,
   *  renderRequests: {
   *   id: String,
   *   imageURL: String,
   *   extension: String,
   *   thumbURL: String,
   *   fetchDelay: String,
   *   pixelCount: Number,
   *   canvas: OffscreenCanvas,
   *   resolutionFraction: Number
   *  }[]
   * }} batchRequest
   */
  constructor(batchRequest) {
    this.id = batchRequest.id;
    this.requestType = batchRequest.requestType;
    this.renderRequests = batchRequest.renderRequests.map(r => new RenderRequest(r));
    this.originalRenderRequests = this.renderRequests;
    this.truncateRenderRequestsExceedingMemoryLimit();
  }

  truncateRenderRequestsExceedingMemoryLimit() {
    const truncatedRequests = [];
    let currentMegabyteSize = 0;

    for (const request of this.renderRequests) {
      const overMemoryLimit = currentMegabyteSize < BatchRenderRequest.settings.megabyteMemoryLimit;
      const underMinimumRequestCount = truncatedRequests.length < BatchRenderRequest.settings.minimumRequestCount;

      if (overMemoryLimit || underMinimumRequestCount) {
        truncatedRequests.push(request);
        currentMegabyteSize += request.estimatedMegabyteSize;
      } else {
        postMessage({
          action: "renderDeleted",
          id: request.id
        });
      }
    }
    this.renderRequests = truncatedRequests;
  }
}

class ImageFetcher {
  /**
   * @type {Set.<String>}
   */
  static idsToFetchFromPostPages = new Set();

  /**
   * @type {Number}
   */
  static get postPageFetchDelay() {
    return ImageFetcher.idsToFetchFromPostPages.size * 250;
  }

  /**
   * @param {RenderRequest} request
   */
  static async setOriginalImageURLAndExtension(request) {
    if (request.extension !== null && request.extension !== undefined) {
      request.imageURL = request.imageURL.replace("jpg", request.extension);
    } else {
      // eslint-disable-next-line require-atomic-updates
      request.imageURL = await ImageFetcher.getOriginalImageURL(request.id);
      request.extension = ImageFetcher.getExtensionFromImageURL(request.imageURL);
    }
  }

  /**
   * @param {String} id
   * @returns {Promise.<String>}
   */
  static getOriginalImageURL(id) {
    const apiURL = "https://api.rule34.xxx//index.php?page=dapi&s=post&q=index&id=" + id;
    return fetch(apiURL)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(response.status + ": " + id);
      })
      .then((html) => {
        return (/ file_url="(.*?)"/).exec(html)[1].replace("api-cdn.", "");
      }).catch(() => {
        return ImageFetcher.getOriginalImageURLFromPostPage(id);
      });
  }

  /**
   * @param {String} id
   * @returns {Promise<String>}
   */
  static async getOriginalImageURLFromPostPage(id) {
    const postPageURL = "https://rule34.xxx/index.php?page=post&s=view&id=" + id;

    ImageFetcher.idsToFetchFromPostPages.add(id);
    await sleep(ImageFetcher.postPageFetchDelay);
    return fetch(postPageURL)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(response.status + ": " + postPageURL);
      })
      .then((html) => {
        ImageFetcher.idsToFetchFromPostPages.delete(id);
        return (/itemprop="image" content="(.*)"/g).exec(html)[1].replace("us.rule34", "rule34");
      }).catch((error) => {
        if (error.message.includes("503")) {
          return ImageFetcher.getOriginalImageURLFromPostPage(id);
        }
        console.error({
          error,
          url: postPageURL
        });
        return "https://rule34.xxx/images/r34chibi.png";
      });
  }

  /**
   * @param {String} imageURL
   * @returns {String}
   */
  static getExtensionFromImageURL(imageURL) {
    try {
      return (/\.(png|jpg|jpeg|gif)/g).exec(imageURL)[1];
    } catch (error) {
      return "jpg";
    }
  }

  /**
   * @param {RenderRequest} request
   * @returns {Promise<Response>}
   */
  static fetchImage(request) {
    return fetch(request.imageURL, {
      signal: request.abortController.signal
    });
  }

  /**
   * @param {RenderRequest} request
   * @returns {Promise.<Blob>}
   */
  static async fetchImageBlob(request) {
    const response = await ImageFetcher.fetchImage(request);
    return response.blob();
  }

  /**
   * @param {String} id
   */
  static async findImageExtensionFromId(id) {
    const imageURL = await ImageFetcher.getOriginalImageURL(id);
    const extension = ImageFetcher.getExtensionFromImageURL(imageURL);

    postMessage({
      action: "extensionFound",
      id,
      extension
    });
  }
}

class ThumbUpscaler {
  static settings = {
    maxCanvasHeight: 16000
  };
  /**
   * @type {Map.<String, OffscreenCanvas>}
   */
  canvases = new Map();
  /**
   * @type {Number}
   */
  screenWidth;
  /**
   * @type {Boolean}
   */
  onSearchPage;

  /**
   * @param {Number} screenWidth
   * @param {Boolean} onSearchPage
   */
  constructor(screenWidth, onSearchPage) {
    this.screenWidth = screenWidth;
    this.onSearchPage = onSearchPage;
  }

  /**
   * @param {{id: String, imageURL: String, canvas: OffscreenCanvas, resolutionFraction: Number}[]} message
   */
  async upscaleMultipleAnimatedCanvases(message) {
    const requests = message.map(r => new RenderRequest(r));

    requests.forEach((request) => {
      this.collectCanvas(request);
    });

    for (const request of requests) {
      ImageFetcher.fetchImage(request)
        .then((response) => {
          return response.blob();
        })
        .then((blob) => {
          createImageBitmap(blob)
            .then((imageBitmap) => {
              this.upscale(request, imageBitmap);
            });
        });
      await sleep(50);
    }
  }

  /**
   * @param {RenderRequest} request
   * @param {ImageBitmap} imageBitmap
   */
  upscale(request, imageBitmap) {
    if (this.onSearchPage || imageBitmap === undefined || !this.canvases.has(request.id)) {
      return;
    }
    this.setCanvasDimensions(request, imageBitmap);
    this.drawCanvas(request.id, imageBitmap);
  }

  /**
   * @param {RenderRequest} request
   * @param {ImageBitmap} imageBitmap
   */
  setCanvasDimensions(request, imageBitmap) {
    const canvas = this.canvases.get(request.id);
    let width = this.screenWidth / request.resolutionFraction;
    let height = (width / imageBitmap.width) * imageBitmap.height;

    if (width > imageBitmap.width) {
      width = imageBitmap.width;
      height = imageBitmap.height;
    }

    if (height > ThumbUpscaler.settings.maxCanvasHeight) {
      width *= (ThumbUpscaler.settings.maxCanvasHeight / height);
      height = ThumbUpscaler.settings.maxCanvasHeight;
    }
    canvas.width = width;
    canvas.height = height;
  }

  /**
   * @param {String} id
   * @param {ImageBitmap} imageBitmap
   */
  drawCanvas(id, imageBitmap) {
    const canvas = this.canvases.get(id);

    if (canvas === undefined) {
      return;
    }
    const context = canvas.getContext("2d");

    if (context === null) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height,
      0, 0, canvas.width, canvas.height
    );
  }

  deleteAllCanvases() {
    for (const [id, canvas] of this.canvases.entries()) {
      this.deleteCanvas(id, canvas);
    }
    this.canvases.clear();
  }

  /**
   * @param {String} id
   * @param {OffscreenCanvas} canvas
   */
  deleteCanvas(id, canvas) {
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
    canvas = null;
    this.canvases.set(id, canvas);
    this.canvases.delete(id);
  }

  /**
   * @param {RenderRequest} request
   */
  collectCanvas(request) {
    if (request.canvas === undefined) {
      return;
    }

    if (!this.canvases.has(request.id)) {
      this.canvases.set(request.id, request.canvas);
    }
  }

  /**
   * @param {BatchRenderRequest} batchRequest
   */
  collectCanvases(batchRequest) {
    batchRequest.originalRenderRequests.forEach((request) => {
      this.collectCanvas(request);
    });
  }
}

class ImageRenderer {
  /**
   * @type {OffscreenCanvas}
   */
  canvas;
  /**
   * @type {CanvasRenderingContext2D}
   */
  context;
  /**
   * @type {ThumbUpscaler}
   */
  thumbUpscaler;
  /**
   * @type {RenderRequest}
   */
  renderRequest;
  /**
   * @type {BatchRenderRequest}
   */
  batchRenderRequest;
  /**
   * @type {Map.<String, RenderRequest>}
   */
  incompleteRenderRequests;
  /**
   * @type {Map.<String, {completed: Boolean, imageBitmap: ImageBitmap, request: RenderRequest}>}
   */
  renders;
  /**
   * @type {String}
   */
  lastRequestedDrawId;
  /**
   * @type {String}
   */
  currentlyDrawnId;
  /**
   * @type {Boolean}
   */
  onMobileDevice;
  /**
   * @type {Boolean}
   */
  onSearchPage;
  /**
   * @type {Boolean}
   */
  usingLandscapeOrientation;

  /**
   * @type {Boolean}
   */
  get hasRenderRequest() {
    return this.renderRequest !== undefined &&
      this.renderRequest !== null;
  }

  /**
   * @type {Boolean}
   */
  get hasBatchRenderRequest() {
    return this.batchRenderRequest !== undefined &&
      this.batchRenderRequest !== null;
  }

  /**
   * @param {{canvas: OffscreenCanvas, screenWidth: Number, onMobileDevice: Boolean, onSearchPage: Boolean }} message
   */
  constructor(message) {
    this.canvas = message.canvas;
    this.context = this.canvas.getContext("2d");
    this.thumbUpscaler = new ThumbUpscaler(message.screenWidth, message.onSearchPage);
    this.renders = new Map();
    this.incompleteRenderRequests = new Map();
    this.lastRequestedDrawId = "";
    this.currentlyDrawnId = "";
    this.onMobileDevice = message.onMobileDevice;
    this.onSearchPage = message.onSearchPage;
    this.usingLandscapeOrientation = true;
    this.configureCanvasQuality();
  }

  configureCanvasQuality() {
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = "high";
    this.context.lineJoin = "miter";
  }

  renderMultipleImages(message) {
    const batchRenderRequest = new BatchRenderRequest(message);

    this.thumbUpscaler.collectCanvases(batchRenderRequest);
    this.abortOutdatedFetchRequests(batchRenderRequest);
    this.deleteRendersNotInNewRequests(batchRenderRequest);
    this.removeStartedRenderRequests(batchRenderRequest);
    this.batchRenderRequest = batchRenderRequest;
    this.renderMultipleImagesHelper(batchRenderRequest);
  }

  /**
   * @param {BatchRenderRequest} batchRenderRequest
   */
  async renderMultipleImagesHelper(batchRenderRequest) {
    for (const request of batchRenderRequest.renderRequests) {
      if (this.renders.has(request.id)) {
        continue;
      }
      this.renders.set(request.id, {
        completed: false,
        imageBitmap: undefined,
        request
      });
    }

    for (const request of batchRenderRequest.renderRequests) {
      this.renderImage(request);
      await sleep(request.fetchDelay);
    }
  }

  /**
   * @param {RenderRequest} request
   */
  async renderImage(request) {
    this.incompleteRenderRequests.set(request.id, request);
    await ImageFetcher.setOriginalImageURLAndExtension(request);
    let blob;

    try {
      blob = await ImageFetcher.fetchImageBlob(request);
    } catch (error) {
      if (error.name === "AbortError") {
        this.deleteRender(request.id);
        this.notifyMainThreadOfRenderDeletion(request.id);
      } else {
        console.error({
          error,
          request
        });
      }
      return;
    }
    const imageBitmap = await createImageBitmap(blob);

    this.renders.set(request.id, {
      completed: true,
      imageBitmap,
      request
    });
    this.incompleteRenderRequests.delete(request.id);
    this.thumbUpscaler.upscale(request, imageBitmap);
    postMessage({
      action: "renderCompleted",
      extension: request.extension,
      id: request.id
    });

    if (this.lastRequestedDrawId === request.id) {
      this.drawCanvas(request.id);
    }
  }

  /**
   * @param {String} id
   * @returns {Boolean}
   */
  renderHasCompleted(id) {
    const render = this.renders.get(id);
    return render !== undefined && render.completed;
  }

  /**
   * @param {String} id
   */
  drawCanvas(id) {
    const render = this.renders.get(id);

    if (render === undefined || render.imageBitmap === undefined) {
      this.clearCanvas();
      return;
    }

    if (this.currentlyDrawnId === id) {
      return;
    }

    if (render.completed) {
      this.currentlyDrawnCanvasId = id;
    }
    const ratio = Math.min(this.canvas.width / render.imageBitmap.width, this.canvas.height / render.imageBitmap.height);
    const centerShiftX = (this.canvas.width - (render.imageBitmap.width * ratio)) / 2;
    const centerShiftY = (this.canvas.height - (render.imageBitmap.height * ratio)) / 2;

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(
      render.imageBitmap, 0, 0, render.imageBitmap.width, render.imageBitmap.height,
      centerShiftX, centerShiftY, render.imageBitmap.width * ratio, render.imageBitmap.height * ratio
    );
  }

  /**
   * @param {Boolean} usingLandscapeOrientation
   */
  changeCanvasOrientation(usingLandscapeOrientation) {
    if (usingLandscapeOrientation !== this.usingLandscapeOrientation) {
      this.swapCanvasOrientation();
    }
  }

  swapCanvasOrientation() {
    const temp = this.canvas.width;

    this.canvas.width = this.canvas.height;
    this.canvas.height = temp;
    this.usingLandscapeOrientation = !this.usingLandscapeOrientation;
  }

  clearCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  deleteAllRenders() {
    this.thumbUpscaler.deleteAllCanvases();
    this.abortAllFetchRequests();

    for (const id of this.renders.keys()) {
      this.deleteRender(id);
    }
    this.batchRenderRequest = undefined;
    this.renderRequest = undefined;
    this.renders.clear();
  }

  /**
   * @param {BatchRenderRequest} newBatchRenderRequest
   */
  deleteRendersNotInNewRequests(newBatchRenderRequest) {
    const idsToRender = newBatchRenderRequest.renderRequestIds;

    for (const id of this.renders.keys()) {
      if (!idsToRender.has(id)) {
        this.deleteRender(id);
        this.notifyMainThreadOfRenderDeletion(id);
      }
    }
  }

  /**
   * @param {String} id
   */
  deleteRender(id) {
    if (!this.renders.has(id)) {
      return;
    }
    const render = this.renders.get(id);

    if (render === undefined) {
      return;
    }

    if (render.imageBitmap !== null && render.imageBitmap !== undefined) {
      render.imageBitmap.close();
    }
    this.renders.set(id, null);
    this.renders.delete(id);
  }

  /**
   * @param {String} id
   */
  notifyMainThreadOfRenderDeletion(id) {
    postMessage({
      action: "renderDeleted",
      id
    });
  }

  /**
   * @param {BatchRenderRequest} newBatchRenderRequest
   */
  abortOutdatedFetchRequests(newBatchRenderRequest) {
    const newIds = newBatchRenderRequest.renderRequestIds;

    for (const [id, request] of this.incompleteRenderRequests.entries()) {
      if (!newIds.has(id)) {
        request.abortController.abort();
        this.incompleteRenderRequests.delete(id);
      }
    }
  }

  abortAllFetchRequests() {
    for (const request of this.incompleteRenderRequests.values()) {
      request.abortController.abort();
    }
    this.incompleteRenderRequests.clear();
  }

  /**
   * @param {BatchRenderRequest} batchRenderRequest
   */
  removeStartedRenderRequests(batchRenderRequest) {
    batchRenderRequest.renderRequests = batchRenderRequest.renderRequests
      .filter(request => !this.renders.has(request.id));
  }
  /**
   * @param {BatchRenderRequest} batchRenderRequest
   */
  removeCompletedRenderRequests(batchRenderRequest) {
    batchRenderRequest.renderRequests = batchRenderRequest.renderRequests
      .filter(request => !this.renderHasCompleted(request.id));
  }

  upscaleAllRenderedThumbs() {
    for (const render of this.renders.values()) {
      this.thumbUpscaler.upscale(render.request, render.imageBitmap);
    }
  }

  onmessage(message) {
    switch (message.action) {
      case "render":
        this.renderRequest = new RenderRequest(message);
        this.lastRequestedDrawId = message.id;
        this.thumbUpscaler.collectCanvas(this.renderRequest);
        this.renderImage(this.renderRequest);
        break;

      case "renderMultiple":
        this.renderMultipleImages(message);
        break;

      case "deleteAllRenders":
        this.deleteAllRenders();
        break;

      case "drawMainCanvas":
        this.lastRequestedDrawId = message.id;
        this.drawCanvas(message.id);
        break;

      case "clearMainCanvas":
        this.clearCanvas();
        break;

      case "upscaleAnimatedThumbs":
        this.thumbUpscaler.upscaleMultipleAnimatedCanvases(message.upscaleRequests);
        break;

      case "changeCanvasOrientation":
        this.changeCanvasOrientation(message.usingLandscapeOrientation);
        break;

      case "upscaleAllRenderedThumbs":
        this.upscaleAllRenderedThumbs();
        break;

      default:
        break;
    }
  }
}

/**
 * @type {ImageRenderer}
 */
let imageRenderer;

onmessage = (message) => {
  switch (message.data.action) {
    case "initialize":
      BatchRenderRequest.settings.megabyteMemoryLimit = message.data.megabyteLimit;
      BatchRenderRequest.settings.minimumRequestCount = message.data.minimumImagesToRender;
      imageRenderer = new ImageRenderer(message.data);
      setInterval(() => {
      }, 1000);

      break;

    case "findExtension":
      ImageFetcher.findImageExtensionFromId(message.data.id);
      break;

    default:
      imageRenderer.onmessage(message.data);
      break;
  }
};
