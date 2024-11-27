const galleryHTML = `<style>
  body {
    width: 99.5vw;
    overflow-x: hidden;
  }

  .focused {
    transition: none;
    float: left;
    overflow: hidden;
    z-index: 9997;
    pointer-events: none;
    position: fixed;
    height: 100vh;
    margin: 0;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  #original-content-container {
    >canvas,img {
      float: left;
      overflow: hidden;
      pointer-events: none;
      position: fixed;
      height: 100vh;
      margin: 0;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  #original-video-container {
    video {
      display: none;
      position:fixed;
      z-index:9998;
      pointer-events:none;
    }
  }

  #low-resolution-canvas {
    z-index: 9996;
  }

  #main-canvas {
    z-index: 9997;
  }

  a.hide {
    cursor: default;
  }

  option {
    font-size: 15px;
  }

  #resolution-dropdown {
    text-align: center;
    width: 160px;
    height: 25px;
    cursor: pointer;
  }

  .thumb-node,
  .thumb {

    >div,
    >a {
      >canvas {
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 1;
      }
    }
  }

  #original-content-background {
    position: fixed;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    background: black;
    z-index: 999;
    display: none;
    pointer-events: none;
  }

</style>
`;/* eslint-disable no-useless-escape */

const galleryDebugHTML = `
  .thumb,
  .thumb-node {
    &.debug-selected {
      outline: 3px solid #0075FF !important;
    }

    &.loaded {

      div {
        outline: 2px solid transparent;
        animation: outlineGlow 1s forwards;
      }

      .image {
        opacity: 1;
      }
    }

    >div>canvas {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 1;
      visibility: hidden;
    }

    .image {
      opacity: 0.4;
      transition: transform 0.1s ease-in-out, opacity 0.5s ease;
    }

  }

  .image.loaded {
    animation: outlineGlow 1s forwards;
    opacity: 1;
  }

  @keyframes outlineGlow {
    0% {
      outline-color: transparent;
    }

    100% {
      outline-color: turquoise;
    }
  }

  #main-canvas, #low-resolution-canvas {
    opacity: 0.25;
  }

  #original-video-container {
    video {
      opacity: 0.15;
    }
  }

  `;

class Gallery {
  static directions = {
    d: "d",
    a: "a",
    right: "ArrowRight",
    left: "ArrowLeft"
  };
  static preferences = {
    showOnHover: "showImagesWhenHovering",
    backgroundOpacity: "galleryBackgroundOpacity",
    resolution: "galleryResolution",
    enlargeOnClick: "enlargeOnClick",
    videoVolume: "videoVolume",
    videoMuted: "videoMuted"
  };
  static localStorageKeys = {
    imageExtensions: "imageExtensions"
  };
  static webWorkers = {
    renderer:
`
/* eslint-disable max-classes-per-file */
/* eslint-disable prefer-template */
/**
 * @param {Number} milliseconds
 * @returns {Promise}
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
   * @type {Boolean}
   */
  hasStarted;

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
    this.hasStarted = false;
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
    const truncatedRequest = [];
    let currentMegabyteSize = 0;

    for (const request of this.renderRequests) {
      const overMemoryLimit = currentMegabyteSize < BatchRenderRequest.settings.megabyteMemoryLimit;
      const underMinimumRequestCount = truncatedRequest.length < BatchRenderRequest.settings.minimumRequestCount;

      if (overMemoryLimit || underMinimumRequestCount) {
        truncatedRequest.push(request);
        currentMegabyteSize += request.estimatedMegabyteSize;
      } else {
        postMessage({
          action: "renderDeleted",
          id: request.id
        });
      }
    }
    this.renderRequests = truncatedRequest;
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
   * @returns {String}
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
   * @returns {String}
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
   * @returns {Promise}
   */
  static fetchImage(request) {
    return fetch(request.imageURL, {
      signal: request.abortController.signal
    });
  }

  /**
   * @param {RenderRequest} request
   * @returns {Blob}
   */
  static async fetchImageBlob(request) {
    const response = await ImageFetcher.fetchImage(request);
    return response.blob();
  }

  /**
   * @param {String} id
   * @returns {String}
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
    const context = canvas.getContext("2d");

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
  }

  /**
   * @param {BatchRenderRequest} batchRenderRequest
   */
  async renderMultipleImages(batchRenderRequest) {
    const batchRequestId = batchRenderRequest.id;

    this.removeCompletedRenderRequests(batchRenderRequest);

    for (const request of batchRenderRequest.renderRequests) {
      if (request.hasStarted || this.renders.has(request.id)) {
        continue;
      }
      this.renders.set(request.id, {
        completed: false,
        imageBitmap: undefined,
        request
      });
    }

    for (const request of batchRenderRequest.renderRequests) {
      if (this.isApartOfOutdatedBatchRequest(batchRequestId) || request.hasStarted) {
        continue;
      }
      this.renderImage(request, batchRequestId);
      await sleep(request.fetchDelay);
    }
  }

  /**
   * @param {RenderRequest} request
   * @param {Number} batchRequestId
   */
  async renderImage(request, batchRequestId) {
    this.incompleteRenderRequests.set(request.id, request);
    await ImageFetcher.setOriginalImageURLAndExtension(request);
    let blob;

    if (this.isApartOfOutdatedBatchRequest(batchRequestId)) {
      return;
    }

    try {
      blob = await ImageFetcher.fetchImageBlob(request);
    } catch (error) {
      if (error.name === "AbortError") {
        this.deleteRender(request.id);
      } else {
        console.error({
          error,
          request
        });
      }
      return;
    }

    if (this.isApartOfOutdatedBatchRequest(batchRequestId)) {
      return;
    }
    const imageBitmap = await createImageBitmap(blob);

    if (this.isApartOfOutdatedBatchRequest(batchRequestId)) {
      return;
    }
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
  renderIsFinished(id) {
    const render = this.renders.get(id);
    return render !== undefined && render.completed;
  }

  /**
   * @param {String} id
   * @returns {Boolean}
   */
  isApartOfOutdatedBatchRequest(id) {
    if (id === undefined || id === null) {
      return false;
    }

    if (!this.hasBatchRenderRequest) {
      return true;
    }
    return this.batchRenderRequest.renderRequestIds.has(id);
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
      this.deleteRender(id, true);
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
      }
    }
  }

  /**
   * @param {String} id
   * @param {Boolean} initiatedByMainThread
   */
  deleteRender(id, initiatedByMainThread = false) {
    if (!this.renders.has(id)) {
      return;
    }
    const imageBitmap = this.renders.get(id).imageBitmap;

    if (imageBitmap !== null && imageBitmap !== undefined) {
      imageBitmap.close();
    }
    this.renders.set(id, null);
    this.renders.delete(id);

    if (initiatedByMainThread) {
      return;
    }
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
   * @param {BatchRenderRequest} newBatchRenderRequest
   */
  markRenderRequestsThatHaveAlreadyStarted(newBatchRenderRequest) {
    if (!this.hasBatchRenderRequest) {
      return;
    }
    const previousRequestIds = this.batchRenderRequest.renderRequestIds;

    newBatchRenderRequest.renderRequests.forEach((request) => {
      request.hasStarted = previousRequestIds.has(request.id);
    });
  }

  /**
   * @param {BatchRenderRequest} batchRenderRequest
   */
  removeCompletedRenderRequests(batchRenderRequest) {
    batchRenderRequest.renderRequests = batchRenderRequest.renderRequests
      .filter(request => !this.renderIsFinished(request.id));
  }

  upscaleAllRenderedThumbs() {
    for (const render of this.renders.values()) {
      this.thumbUpscaler.upscale(render.request, render.imageBitmap);
    }
  }

  onmessage(message) {
    let batchRenderRequest;

    switch (message.action) {
      case "render":
        this.renderRequest = new RenderRequest(message);
        this.lastRequestedDrawId = message.id;
        this.thumbUpscaler.collectCanvas(this.renderRequest);
        this.renderImage(this.renderRequest);
        break;

      case "renderMultiple":
        batchRenderRequest = new BatchRenderRequest(message);
        this.thumbUpscaler.collectCanvases(batchRenderRequest);
        this.abortOutdatedFetchRequests(batchRenderRequest);
        this.markRenderRequestsThatHaveAlreadyStarted(batchRenderRequest);
        this.deleteRendersNotInNewRequests(batchRenderRequest);
        this.batchRenderRequest = batchRenderRequest;
        this.renderMultipleImages(batchRenderRequest);
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
      break;

    case "findExtension":
      ImageFetcher.findImageExtensionFromId(message.data.id);
      break;

    default:
      imageRenderer.onmessage(message.data);
      break;
  }
};

`
  };
  static mainCanvasResolutions = {
    search: onMobileDevice() ? "7680x4320" : "3840x2160",
    favorites: "7680x4320"
  };
  static htmlAttributes = {
    thumbIndex: "index"
  };
  static extensionDecodings = {
    0: "jpg",
    1: "png",
    2: "jpeg",
    3: "gif"
  };
  static extensionEncodings = {
    "jpg": 0,
    "png": 1,
    "jpeg": 2,
    "gif": 3
  };
  static swipeControls = {
    threshold: 60,
    touchStart: {
      x: 0,
      y: 0
    },
    touchEnd: {
      x: 0,
      y: 0
    },
    get deltaX() {
      return this.touchStart.x - this.touchEnd.x;
    },
    get deltaY() {
      return this.touchStart.y - this.touchEnd.y;
    },
    get right() {
      return this.deltaX < -this.threshold;
    },
    get left() {
      return this.deltaX > this.threshold;
    },
    get up() {
      return this.deltaY > this.threshold;
    },
    get down() {
      return this.deltaY < -this.threshold;
    },
    /**
     * @param {TouchEvent} touchEvent
     * @param {Boolean} atStart
     */
    set(touchEvent, atStart) {
      if (atStart) {
        this.touchStart.x = touchEvent.changedTouches[0].screenX;
        this.touchStart.y = touchEvent.changedTouches[0].screenY;
      } else {
        this.touchEnd.x = touchEvent.changedTouches[0].screenX;
        this.touchEnd.y = touchEvent.changedTouches[0].screenY;
      }
    }
  };
  static settings = {
    maxImagesToRenderInBackground: 50,
    maxImagesToRenderAround: onMobileDevice() ? 2 : 50,
    megabyteLimit: onMobileDevice() ? 0 : 375,
    minImagesToRender: onMobileDevice() ? 3 : 8,
    imageFetchDelay: 250,
    throttledImageFetchDelay: 400,
    imageFetchDelayWhenExtensionKnown: 25,
    upscaledThumbResolutionFraction: 4,
    upscaledAnimatedThumbResolutionFraction: 6,
    extensionsFoundBeforeSavingCount: 100,
    animatedThumbsToUpscaleRange: 20,
    animatedThumbsToUpscaleDiscrete: 20,
    traversalCooldownTime: 300,
    renderOnPageChangeCooldownTime: 2000,
    addFavoriteCooldownTime: 250,
    cursorVisibilityCooldownTime: 500,
    imageExtensionAssignmentCooldownTime: 1000,
    additionalVideoPlayerCount: onMobileDevice() ? 0 : 2,
    renderAroundAggressively: true,
    loopAtEndOfGalleryValue: false,
    get loopAtEndOfGallery() {
      if (!onFavoritesPage() || !Gallery.finishedLoading) {
        return true;
      }
      return this.loopAtEndOfGalleryValue;
    },
    debugEnabled: false,
    developerMode: true
  };
  static keyHeldDownTraversalCooldown = new Cooldown(Gallery.settings.traversalCooldownTime);
  static backgroundRenderingOnPageChangeCooldown = new Cooldown(Gallery.settings.renderOnPageChangeCooldownTime, true);
  static addOrRemoveFavoriteCooldown = new Cooldown(Gallery.settings.addFavoriteCooldownTime, true);
  static cursorVisibilityCooldown = new Cooldown(Gallery.settings.cursorVisibilityCooldownTime);
  static imageExtensionAssignmentCooldown = new Cooldown(Gallery.settings.imageExtensionAssignmentCooldownTime);
  static finishedLoading = onSearchPage();

  /**
   * @returns {Boolean}
   */
  static get disabled() {
    return (onMobileDevice() && onSearchPage()) || getPerformanceProfile() > 0 || onPostPage();
  }

  /**
   * @type {Autoplay}
   */
  autoplayController;
  /**
   * @type {HTMLDivElement}
   */
  originalContentContainer;
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
   * @type {HTMLDivElement}
   */
  videoContainer;
  /**
   * @type {HTMLVideoElement[]}
   */
  videoPlayers;
  /**
   * @type {HTMLImageElement}
   */
  gifContainer;
  /**
   * @type {HTMLDivElement}
   */
  background;
  /**
   * @type {HTMLElement}
   */
  thumbUnderCursor;
  /**
   * @type {HTMLElement}
   */
  lastEnteredThumb;
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
   * @type {Map.<String, {start: Number, end:Number}>}
   */
  videoClips;
  /**
   * @type {HTMLElement[]}
   */
  visibleThumbs;
  /**
   * @type {ThumbNode[]}
   */
  latestSearchResults;
  /**
   * @type {Object.<Number, String>}
   */
  imageExtensions;
  /**
   * @type {String}
   */
  foundFavoriteId;
  /**
   * @type {String}
   */
  changedPageInGalleryDirection;
  /**
   * @type {Number}
   */
  recentlyDiscoveredImageExtensionCount;
  /**
   * @type {Number}
   */
  currentlySelectedThumbIndex;
  /**
   * @type {Number}
   */
  lastSelectedThumbIndexBeforeEnteringGallery;
  /**
   * @type {Number}
   */
  currentBatchRenderRequestId;
  /**
   * @type {Boolean}
   */
  inGallery;
  /**
   * @type {Boolean}
   */
  recentlyEnteredGallery;
  /**
   * @type {Boolean}
   */
  recentlyExitedGallery;
  /**
   * @type {Boolean}
   */
  leftPage;
  /**
   * @type {Boolean}
   */
  favoritesWereFetched;
  /**
   * @type {Boolean}
   */
  showOriginalContentOnHover;
  /**
   * @type {Boolean}
   */
  enlargeOnClickOnMobile;

  /**
   * @type {Boolean}
   */
  get changedPageWhileInGallery() {
    return this.changedPageInGalleryDirection !== null;
  }

  constructor() {
    if (Gallery.disabled) {
      return;
    }
    this.createAutoplayController();
    this.initializeFields();
    this.initializeTimers();
    this.setMainCanvasResolution();
    this.createWebWorkers();
    this.createVideoBackgrounds();
    this.addEventListeners();
    this.loadDiscoveredImageExtensions();
    this.prepareSearchPage();
    this.insertHTML();
    this.updateBackgroundOpacity(getPreference(Gallery.preferences.backgroundOpacity, 1));
    this.loadVideoClips();
    this.setMainCanvasOrientation();
  }

  initializeFields() {
    this.mainCanvas = document.createElement("canvas");
    this.lowResolutionCanvas = document.createElement("canvas");
    this.lowResolutionContext = this.lowResolutionCanvas.getContext("2d");
    this.thumbUnderCursor = null;
    this.lastEnteredThumb = null;
    this.startedRenders = new Set();
    this.completedRenders = new Set();
    this.transferredCanvases = new Map();
    this.videoClips = new Map();
    this.visibleThumbs = [];
    this.latestSearchResults = [];
    this.imageExtensions = {};
    this.foundFavoriteId = null;
    this.changedPageInGalleryDirection = null;
    this.recentlyDiscoveredImageExtensionCount = 0;
    this.currentlySelectedThumbIndex = 0;
    this.lastSelectedThumbIndexBeforeEnteringGallery = 0;
    this.currentBatchRenderRequestId = 0;
    this.inGallery = false;
    this.recentlyEnteredGallery = false;
    this.recentlyExitedGallery = false;
    this.leftPage = false;
    this.favoritesWereFetched = false;
    this.showOriginalContentOnHover = getPreference(Gallery.preferences.showOnHover, true);
    this.enlargeOnClickOnMobile = getPreference(Gallery.preferences.enlargeOnClick, true);
  }

  initializeTimers() {
    Gallery.backgroundRenderingOnPageChangeCooldown.onDebounceEnd = () => {
      this.onPageChange();
    };
    Gallery.imageExtensionAssignmentCooldown.onCooldownEnd = () => {
      if (this.recentlyDiscoveredImageExtensionCount > 0) {
        this.storeAllImageExtensions();
      }
    };
  }

  setMainCanvasResolution() {
    const resolution = onSearchPage() ? Gallery.mainCanvasResolutions.search : Gallery.mainCanvasResolutions.favorites;
    const dimensions = resolution.split("x").map(dimension => parseFloat(dimension));

    this.mainCanvas.width = dimensions[0];
    this.mainCanvas.height = dimensions[1];
  }

  createWebWorkers() {
    const offscreenCanvas = this.mainCanvas.transferControlToOffscreen();

    this.imageRenderer = new Worker(getWorkerURL(Gallery.webWorkers.renderer));
    this.imageRenderer.postMessage({
      action: "initialize",
      canvas: offscreenCanvas,
      onMobileDevice: onMobileDevice(),
      screenWidth: window.screen.width,
      megabyteLimit: Gallery.settings.megabyteLimit,
      minimumImagesToRender: Gallery.settings.minImagesToRender,
      onSearchPage: onSearchPage()
    }, [offscreenCanvas]);
  }

  createVideoBackgrounds() {
    document.createElement("canvas").toBlob((blob) => {
      const videoBackgroundURL = URL.createObjectURL(blob);

      for (const video of this.videoPlayers) {
        video.setAttribute("poster", videoBackgroundURL);
      }
    });
  }

  addEventListeners() {
    this.addGalleryEventListeners();
    this.addFavoritesLoaderEventListeners();
    this.addWebWorkerMessageHandlers();
    this.addMobileEventListeners();
    this.addMemoryManagementEventListeners();
  }

  addGalleryEventListeners() {
    window.addEventListener("load", () => {
      if (onSearchPage()) {
        this.initializeThumbsForHovering.bind(this)();
        this.enumerateVisibleThumbs();
      }
      this.hideCaptionsWhenShowingOriginalContent();
    }, {
      once: true,
      passive: true
    });
    document.addEventListener("mousedown", (event) => {
      const autoplayMenu = document.getElementById("autoplay-menu");

      if (autoplayMenu !== null && autoplayMenu.contains(event.target)) {
        return;
      }
      const clickedOnAnImage = event.target.tagName.toLowerCase() === "img";
      const clickedOnAThumb = clickedOnAnImage && getThumbFromImage(event.target).className.includes("thumb");
      const clickedOnACaptionTag = event.target.classList.contains("caption-tag");
      const thumb = clickedOnAThumb ? getThumbFromImage(event.target) : null;

      if (clickedOnAThumb) {
        this.currentlySelectedThumbIndex = this.getIndexFromThumb(thumb);
      }

      switch (event.button) {
        case CLICK_CODES.left:
          if (this.inGallery) {
            if (isVideo(this.getSelectedThumb()) && !onMobileDevice()) {
              return;
            }
            this.exitGallery();
            this.toggleAllVisibility(false);
            return;
          }

          if (thumb === null) {
            return;
          }

          if (onMobileDevice()) {
            if (!this.enlargeOnClickOnMobile) {
              this.openPostInNewPage(thumb);
              return;
            }
            this.deleteAllRenders();
          }
          this.toggleAllVisibility(true);
          this.enterGallery();
          this.showOriginalContent(thumb);
          break;

        case CLICK_CODES.middle:
          event.preventDefault();

          if (thumb !== null || this.inGallery) {
            this.openPostInNewPage();
          } else if (!this.inGallery && !clickedOnACaptionTag) {
            this.toggleAllVisibility();
            setPreference(Gallery.preferences.showOnHover, this.showOriginalContentOnHover);
          }
          break;

        default:
          break;
      }
    });
    window.addEventListener("auxclick", (event) => {
      if (event.button === CLICK_CODES.middle) {
        event.preventDefault();
      }
    });
    document.addEventListener("wheel", (event) => {
      if (event.shiftKey) {
        return;
      }

      if (this.inGallery) {
        if (event.ctrlKey) {
          return;
        }
        const delta = (event.wheelDelta ? event.wheelDelta : -event.deltaY);
        const direction = delta > 0 ? Gallery.directions.left : Gallery.directions.right;

        this.traverseGallery.bind(this)(direction, false);
      } else if (this.thumbUnderCursor !== null && this.showOriginalContentOnHover) {
        let opacity = parseFloat(getPreference(Gallery.preferences.backgroundOpacity, 1));

        opacity -= event.deltaY * 0.0005;
        opacity = clamp(opacity, "0", "1");
        this.updateBackgroundOpacity(opacity);
      }
    }, {
      passive: true
    });
    document.addEventListener("contextmenu", (event) => {
      if (this.inGallery) {
        event.preventDefault();
        this.exitGallery();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (!this.inGallery) {
        return;
      }

      switch (event.key) {
        case Gallery.directions.a:

        case Gallery.directions.d:

        case Gallery.directions.left:

        case Gallery.directions.right:
          this.traverseGallery(event.key, event.repeat);
          break;

        case "X":

        case "x":
          this.unFavoriteSelectedContent();
          break;

        case " ":
          if (isVideo(this.getSelectedThumb())) {
            const video = this.getActiveVideoPlayer();

            if (video === document.activeElement) {
              return;
            }

            if (video.paused) {
              video.play().catch(() => { });
            } else {
              video.pause();
            }
          }
          break;

        default:
          break;
      }
    }, {
      passive: true
    });
    window.addEventListener("keydown", async(event) => {
      if (!this.inGallery) {
        return;
      }

      switch (event.key) {
        case "F":

        case "f":
          await this.addFavoriteInGallery(event);
          break;

        case "M":

        case "m":
          if (isVideo(this.getSelectedThumb())) {
            this.getActiveVideoPlayer().muted = !this.getActiveVideoPlayer().muted;
          }
          break;

        case "B":

        case "b":
          this.toggleBackgroundOpacity();
          break;

        case "n":
          this.toggleCursorVisibility(true);
          Gallery.cursorVisibilityCooldown.restart();
          break;

        case "Escape":
          this.exitGallery();
          this.toggleAllVisibility(false);
          break;

        default:
          break;
      }
    }, {
      passive: true
    });
  }

  addFavoritesLoaderEventListeners() {
    if (onSearchPage()) {
      return;
    }
    window.addEventListener("favoritesFetched", () => {
      this.initializeThumbsForHovering.bind(this)();
      this.enumerateVisibleThumbs();
    });
    window.addEventListener("newFavoritesFetchedOnReload", (event) => {
      if (event.detail.empty) {
        return;
      }
      this.initializeThumbsForHovering.bind(this)(event.detail.thumbs);
      this.enumerateVisibleThumbs();
      /**
       * @type {HTMLElement[]}
       */
      const thumbs = event.detail.thumbs.reverse();

      if (thumbs.length > 0) {
        const thumb = thumbs[0];

        this.upscaleAnimatedThumbsAround(thumb);
        this.renderImages(thumbs
          .filter(t => isImage(t))
          .slice(0, 20));
      }
    }, {
      once: true
    });
    window.addEventListener("startedFetchingFavorites", () => {
      this.favoritesWereFetched = true;
      setTimeout(() => {
        const thumb = document.querySelector(".thumb-node");

        this.renderImagesInTheBackground();

        if (thumb !== null && !Gallery.finishedLoading) {
          this.upscaleAnimatedThumbsAround(thumb);
        }
      }, 650);
    }, {
      once: true
    });
    window.addEventListener("favoritesLoaded", () => {
      Gallery.backgroundRenderingOnPageChangeCooldown.waitTime = 1000;
      Gallery.finishedLoading = true;
      this.initializeThumbsForHovering.bind(this)();
      this.enumerateVisibleThumbs();
      this.findImageExtensionsInTheBackground();

      if (!this.favoritesWereFetched) {
        this.renderImagesInTheBackground();
      }
    }, {
      once: true
    });
    window.addEventListener("newSearchResults", (event) => {
      this.latestSearchResults = event.detail;
    });
    window.addEventListener("changedPage", () => {
      this.initializeThumbsForHovering.bind(this)();
      this.enumerateVisibleThumbs();

      if (this.changedPageWhileInGallery) {
        setTimeout(() => {
          this.imageRenderer.postMessage({
            action: "upscaleAllRenderedThumbs"
          });
        }, 100);
      } else {
        this.clearMainCanvas();
        this.clearVideoSources();
        this.toggleOriginalContentVisibility(false);
        this.deleteAllRenders();

        if (Gallery.settings.debugEnabled) {
          Array.from(getAllThumbs()).forEach((thumb) => {
            thumb.classList.remove("loaded");
            thumb.classList.remove("debug-selected");
          });
        }
      }
      this.onPageChange();
    });
    window.addEventListener("foundFavorite", (event) => {
      this.foundFavoriteId = event.detail;
    });
    window.addEventListener("shuffle", () => {
      this.enumerateVisibleThumbs();
      this.deleteAllRenders();
      this.renderImagesInTheBackground();
    });
    window.addEventListener("favoriteMetadataFetched", (event) => {
      this.assignImageExtension(event.detail.id, event.detail.extension);
    });
    window.addEventListener("didNotChangePageInGallery", (event) => {
      if (this.inGallery) {
        this.setNextSelectedThumbIndex(event.detail);
        this.traverseGalleryHelper();
      }
    });
  }

  addWebWorkerMessageHandlers() {
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
          this.assignImageExtension(message.id, message.extension);
          break;

        default:
          break;
      }
    };
  }

  addMobileEventListeners() {
    if (!onMobileDevice()) {
      return;
    }
    window.addEventListener("blur", () => {
      this.deleteAllRenders();
    });
    document.addEventListener("touchstart", (event) => {
      if (!this.inGallery) {
        return;
      }
      event.preventDefault();
      Gallery.swipeControls.set(event, true);
    }, {
      passive: false
    });
    document.addEventListener("touchend", (event) => {
      if (!this.inGallery) {
        return;
      }
      event.preventDefault();
      Gallery.swipeControls.set(event, false);

      if (Gallery.swipeControls.up) {
        this.exitGallery();
        this.toggleAllVisibility(false);
      } else if (Gallery.swipeControls.left) {
        this.traverseGallery(Gallery.directions.right, false);
      } else if (Gallery.swipeControls.right) {
        this.traverseGallery(Gallery.directions.left, false);
      } else {
        this.exitGallery();
        this.toggleAllVisibility(false);
      }
    }, {
      passive: false
    });

    window.addEventListener("orientationchange", () => {
      if (this.imageRenderer !== null && this.imageRenderer !== undefined) {
        this.setMainCanvasOrientation();
      }
    }, {
      passive: true
    });
  }

  setMainCanvasOrientation() {
    if (!onMobileDevice()) {
      return;
    }
    const usingLandscapeOrientation = window.screen.orientation.angle === 90;

    this.imageRenderer.postMessage({
      action: "changeCanvasOrientation",
      usingLandscapeOrientation
    });

    if (!this.inGallery) {
      return;
    }

    const thumb = this.getSelectedThumb();

    if (thumb === undefined || thumb === null) {
      return;
    }
    this.imageRenderer.postMessage(this.getRenderRequest(thumb));
  }

  addMemoryManagementEventListeners() {
    if (onFavoritesPage()) {
      return;
    }
    window.addEventListener("blur", () => {
      this.leftPage = true;
      this.deleteAllRenders();
      this.clearInactiveVideoSources();
    });
    window.addEventListener("focus", () => {
      if (this.leftPage) {
        this.renderImagesInTheBackground();
        this.leftPage = false;
      }
    });
  }

  loadDiscoveredImageExtensions() {
    this.imageExtensions = JSON.parse(localStorage.getItem(Gallery.localStorageKeys.imageExtensions)) || {};
  }

  async prepareSearchPage() {
    if (!onSearchPage()) {
      return;
    }
    const imageList = document.getElementsByClassName("image-list")[0];
    const thumbs = Array.from(imageList.querySelectorAll(".thumb"));
    const scripts = Array.from(imageList.querySelectorAll("script"));

    for (const thumb of thumbs) {
      removeTitleFromImage(getImageFromThumb(thumb));
      assignContentType(thumb);
      thumb.id = thumb.id.substring(1);
    }

    for (const script of scripts) {
      script.remove();
    }
    await this.findImageExtensionsOnSearchPage();
    this.renderImagesInTheBackground();
  }

  insertHTML() {
    this.insertStyleHTML();
    this.insertDebugHTML();
    this.insertOptionsHTML();
    this.insertOriginalContentContainerHTML();

  }

  insertStyleHTML() {
    insertStyleHTML(galleryHTML);
  }

  insertDebugHTML() {
    if (Gallery.settings.debugEnabled) {
      insertStyleHTML(galleryDebugHTML, "gallery-debug");
    }
  }

  insertOptionsHTML() {
    this.insertShowOnHoverOption();
  }

  insertShowOnHoverOption() {
    let optionId = "show-content-on-hover";
    let optionText = "Fullscreen on Hover";
    let optionTitle = "View full resolution images or play videos and GIFs when hovering over a thumbnail";
    let optionIsChecked = this.showOriginalContentOnHover;
    let onOptionChanged = (event) => {
      setPreference(Gallery.preferences.showOnHover, event.target.checked);
      this.toggleAllVisibility(event.target.checked);
    };

    if (onMobileDevice()) {
      optionId = "open-post-in-new-page-on-mobile";
      optionText = "Enlarge on Click";
      optionTitle = "View full resolution images/play videos when a thumbnail is clicked";
      optionIsChecked = this.enlargeOnClickOnMobile;
      onOptionChanged = (event) => {
        setPreference(Gallery.preferences.enlargeOnClick, event.target.checked);
        this.enlargeOnClickOnMobile = event.target.checked;
      };
    }
    createFavoritesOption(
      optionId,
      optionText,
      optionTitle,
      optionIsChecked,
      onOptionChanged,
      true
      // "(Middle Click)"
    );
  }

  insertOriginalContentContainerHTML() {
    const originalContentContainerHTML = `
          <div id="original-content-container">
              <div id="original-video-container">
                <video id="video-player-0" width="100%" height="100%" autoplay muted loop controlsList="nofullscreen" active></video>
              </div>
              <img id="original-gif-container" class="focused"></img>
              <div id="original-content-background"></div>
          </div>
      `;

    document.body.insertAdjacentHTML("afterbegin", originalContentContainerHTML);
    this.originalContentContainer = document.getElementById("original-content-container");
    this.originalContentContainer.insertBefore(this.lowResolutionCanvas, this.originalContentContainer.firstChild);
    this.originalContentContainer.insertBefore(this.mainCanvas, this.originalContentContainer.firstChild);
    this.background = document.getElementById("original-content-background");
    this.videoContainer = document.getElementById("original-video-container");
    this.addAdditionalVideoPlayers();
    this.videoPlayers = Array.from(this.videoContainer.querySelectorAll("video"));
    this.addVideoPlayerEventListeners();
    this.loadVideoVolume();
    this.gifContainer = document.getElementById("original-gif-container");
    this.mainCanvas.id = "main-canvas";
    this.lowResolutionCanvas.id = "low-resolution-canvas";
    this.lowResolutionCanvas.width = this.mainCanvas.width;
    this.lowResolutionCanvas.height = this.mainCanvas.height;
    this.toggleOriginalContentVisibility(false);
    this.addBackgroundEventListeners();

    if (Autoplay.disabled || !this.autoplayController.active || this.autoplayController.paused) {
      this.toggleVideoLooping(true);
    } else {
      this.toggleVideoLooping(false);
    }
  }

  addAdditionalVideoPlayers() {
    const videoPlayerHTML = "<video width=\"100%\" height=\"100%\" autoplay muted loop controlsList=\"nofullscreen\"></video>";

    for (let i = 0; i < Gallery.settings.additionalVideoPlayerCount; i += 1) {
      this.videoContainer.insertAdjacentHTML("beforeend", videoPlayerHTML);
    }
  }

  addVideoPlayerEventListeners() {
    for (const video of this.videoPlayers) {
      video.addEventListener("mousemove", () => {
        if (!video.hasAttribute("controls")) {
          video.setAttribute("controls", "");
        }
      }, {
        passive: true
      });
      video.addEventListener("click", () => {
        if (video.paused) {
          video.play().catch(() => { });
        } else {
          video.pause();
        }
      }, {
        passive: true
      });
      video.addEventListener("volumechange", (event) => {
        if (!event.target.hasAttribute("active")) {
          return;
        }
        setPreference(Gallery.preferences.videoVolume, video.volume);
        setPreference(Gallery.preferences.videoMuted, video.muted);

        for (const v of this.getInactiveVideoPlayers()) {
          v.volume = video.volume;
          v.muted = video.muted;
        }
      }, {
        passive: true
      });
      video.addEventListener("ended", () => {
        this.autoplayController.onVideoEnded();
      }, {
        passive: true
      });
      video.addEventListener("dblclick", () => {
        if (this.inGallery && !this.recentlyEnteredGallery) {
          this.exitGallery();
          this.toggleAllVisibility(false);
        }
      });
    }
  }

  addBackgroundEventListeners() {
    if (onMobileDevice()) {
      return;
    }
    this.background.addEventListener("mousemove", () => {
      Gallery.cursorVisibilityCooldown.restart();
      this.toggleCursorVisibility(true);
    }, {
      passive: true
    });
    Gallery.cursorVisibilityCooldown.onCooldownEnd = () => {
      if (this.inGallery) {
        this.toggleCursorVisibility(false);
      }
    };
  }

  loadVideoVolume() {
    const video = this.getActiveVideoPlayer();

    video.volume = parseFloat(getPreference(Gallery.preferences.videoVolume, 1));
    video.muted = getPreference(Gallery.preferences.videoMuted, true);
  }

  /**
   * @param {Number} opacity
   */
  updateBackgroundOpacity(opacity) {
    this.background.style.opacity = opacity;
    setPreference(Gallery.preferences.backgroundOpacity, opacity);
  }

  createAutoplayController() {
    const subscribers = new AutoplayListenerList(
      () => {
        this.toggleVideoLooping(false);
      },
      () => {
        this.toggleVideoLooping(true);
      },
      () => {
        this.toggleVideoLooping(true);
      },
      () => {
        this.toggleVideoLooping(false);
      },
      () => {
        if (this.inGallery) {
          const direction = Autoplay.settings.moveForward ? Gallery.directions.right : Gallery.directions.left;

          this.traverseGallery(direction, false);
        }
      },
      () => {
        if (this.inGallery && isVideo(this.getSelectedThumb())) {
          this.playOriginalVideo(this.getSelectedThumb());
        }
      }
    );

    this.autoplayController = new Autoplay(subscribers);
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  initializeThumbsForHovering(thumbs) {
    const thumbElements = thumbs === undefined ? getAllThumbs() : thumbs;

    for (const thumbElement of thumbElements) {
      this.addEventListenersToThumb(thumbElement);
    }
  }

  renderImagesInTheBackground() {
    if (onMobileDevice() && !this.enlargeOnClickOnMobile) {
      return;
    }
    const animatedThumbsToUpscale = Array.from(getAllVisibleThumbs())
      .slice(0, Gallery.settings.animatedThumbsToUpscaleDiscrete)
      .filter(thumb => !isImage(thumb));

    this.upscaleAnimatedThumbs(animatedThumbsToUpscale);

    const imageThumbsToRender = this.getVisibleUnrenderedImageThumbs()
      .slice(0, Gallery.settings.maxImagesToRenderInBackground);

    this.renderImages(imageThumbsToRender);
  }

  onPageChange() {
    this.onPageChangeHelper();
    this.foundFavoriteId = null;
    this.changedPageInGalleryDirection = null;
  }

  onPageChangeHelper() {
    if (this.visibleThumbs.length <= 0) {
      return;
    }

    if (this.changedPageInGalleryDirection !== null) {
      this.onPageChangedInGallery();
      return;
    }

    if (this.foundFavoriteId !== null) {
      this.onFavoriteFound();
      return;
    }
    setTimeout(() => {
      if (Gallery.backgroundRenderingOnPageChangeCooldown.ready) {
        this.renderImagesInTheBackground();
      }
    }, 100);
  }

  onPageChangedInGallery() {
    if (this.changedPageInGalleryDirection === "ArrowRight") {
      this.currentlySelectedThumbIndex = 0;
    } else {
      this.currentlySelectedThumbIndex = this.visibleThumbs.length - 1;
    }
    this.traverseGalleryHelper();
  }

  onFavoriteFound() {
    const thumb = document.getElementById(this.foundFavoriteId);

    if (thumb !== null) {
      this.renderImagesAround(thumb);
    }
  }

  /**
   * @param {HTMLElement[]} imagesToRender
   */
  renderImages(imagesToRender) {
    const renderRequests = imagesToRender.map(image => this.getRenderRequest(image));
    const canvases = onSearchPage() ? [] : renderRequests
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
        const thumbNode = ThumbNode.allThumbNodes.get(message.id);

        if (thumbNode !== undefined && thumbNode.root !== undefined) {
          thumbNode.root.classList.add("loaded");
        }
      }
    }

    if (thumb !== null && message.extension === "gif") {
      getImageFromThumb(thumb).setAttribute("gif", true);
      return;
    }
    this.assignImageExtension(message.id, message.extension);
    this.drawMainCanvasOnRenderCompleted(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   */
  drawMainCanvasOnRenderCompleted(thumb) {
    if (thumb === null) {
      return;
    }
    const mainCanvasIsVisible = this.showOriginalContentOnHover || this.inGallery;

    if (!mainCanvasIsVisible) {
      return;
    }
    const selectedThumb = this.getSelectedThumb();
    const selectedThumbIsImage = selectedThumb !== undefined && isImage(selectedThumb);

    if (!selectedThumbIsImage) {
      return;
    }

    if (selectedThumb.id === thumb.id) {
      this.drawMainCanvas(thumb);
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

  deleteAllRenders() {
    this.startedRenders.clear();
    this.completedRenders.clear();
    this.deleteAllTransferredCanvases();
    this.imageRenderer.postMessage({
      action: "deleteAllRenders"
    });

    if (Gallery.settings.debugEnabled) {
      if (Gallery.settings.loopAtEndOfGallery) {
        for (const thumb of this.visibleThumbs) {
          thumb.classList.remove("loaded");
        }
      } else {
        for (const thumbNode of ThumbNode.allThumbNodes.values()) {
          if (thumbNode.root !== undefined) {
            thumbNode.root.classList.remove("loaded");
          }
        }
      }
    }
  }

  deleteAllTransferredCanvases() {
    if (onSearchPage()) {
      return;
    }

    for (const id of this.transferredCanvases.keys()) {
      this.transferredCanvases.get(id).remove();
      this.transferredCanvases.delete(id);
    }
    this.transferredCanvases.clear();
  }

  /**
   * @returns {HTMLElement[]}
   */
  getVisibleUnrenderedImageThumbs() {
    let thumbs = Array.from(getAllVisibleThumbs()).filter((thumb) => {
      return isImage(thumb) && !this.renderHasStarted(thumb);
    });

    if (onSearchPage()) {
      thumbs = thumbs.filter(thumb => !thumb.classList.contains("blacklisted-image"));
    }
    return thumbs;
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

  /**
   * @param {HTMLElement} thumb
   * @returns {HTMLCanvasElement}
   */
  getOffscreenCanvasFromThumb(thumb) {
    const canvas = this.getCanvasFromThumb(thumb);

    this.transferredCanvases.set(thumb.id, canvas);
    return canvas.transferControlToOffscreen();
  }

  hideCaptionsWhenShowingOriginalContent() {
    for (const caption of document.getElementsByClassName("caption")) {
      if (this.showOriginalContentOnHover) {
        caption.classList.add("hide");
      } else {
        caption.classList.remove("hide");
      }
    }
  }

  findImageExtensionsOnSearchPage() {
    const searchPageAPIURL = this.getSearchPageAPIURL();
    return fetch(searchPageAPIURL)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        return null;
      }).then((html) => {
        if (html === null) {
          console.error(`Failed to fetch: ${searchPageAPIURL}`);
        }
        const dom = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
        const posts = Array.from(dom.getElementsByTagName("post"));

        for (const post of posts) {
          const originalImageURL = post.getAttribute("file_url");
          const isAnImage = getContentType(post.getAttribute("tags")) === "image";
          const isBlacklisted = originalImageURL === "https://api-cdn.rule34.xxx/images//";

          if (!isAnImage || isBlacklisted) {
            continue;
          }
          const id = post.getAttribute("id");
          const extension = getExtensionFromImageURL(originalImageURL);

          this.assignImageExtension(id, extension);
        }
      });
  }

  async findImageExtensionsInTheBackground() {
    await sleep(1000);
    const idsWithUnknownExtensions = this.getIdsWithUnknownExtensions(Array.from(ThumbNode.allThumbNodes.values()));

    while (idsWithUnknownExtensions.length > 0) {
      await sleep(3000);

      while (idsWithUnknownExtensions.length > 0 && Gallery.finishedLoading) {
        const id = idsWithUnknownExtensions.pop();

        if (id !== undefined && id !== null && !this.extensionIsKnown(id)) {
          this.imageRenderer.postMessage({
            action: "findExtension",
            id
          });
          await sleep(10);
        }
      }
    }
    Gallery.settings.extensionsFoundBeforeSavingCount = 0;
  }

  /**
   * @param {String} id
   * @param {String} extension
   */
  assignImageExtension(id, extension) {
    if (this.imageExtensions[parseInt(id)] !== undefined) {
      return;
    }
    Gallery.imageExtensionAssignmentCooldown.restart();
    this.setImageExtension(id, extension);
    this.updateStoredImageExtensions();
  }

  updateStoredImageExtensions() {
    this.recentlyDiscoveredImageExtensionCount += 1;

    if (this.recentlyDiscoveredImageExtensionCount >= Gallery.settings.extensionsFoundBeforeSavingCount) {
      this.storeAllImageExtensions();
    }
  }

  storeAllImageExtensions() {
    if (!onFavoritesPage()) {
      return;
    }
    this.recentlyDiscoveredImageExtensionCount = 0;
    localStorage.setItem(Gallery.localStorageKeys.imageExtensions, JSON.stringify(this.imageExtensions));
  }

  /**
   * @param {String | Number} id
   * @returns {String}
   */
  getImageExtension(id) {
    return Gallery.extensionDecodings[this.imageExtensions[parseInt(id)]];
  }

  /**
   * @param {String | Number} id
   * @param {String} extension
   */
  setImageExtension(id, extension) {
    this.imageExtensions[parseInt(id)] = Gallery.extensionEncodings[extension];
  }

  /**
   * @param {String} id
   * @returns {Boolean}
   */
  extensionIsKnown(id) {
    return this.getImageExtension(id) !== undefined;
  }

  /**
   * @returns {String}
   */
  getSearchPageAPIURL() {
    const postsPerPage = 42;
    const apiURL = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&limit=${postsPerPage}`;
    let blacklistedTags = ` ${negateTags(TAG_BLACKLIST)}`.replace(/\s-/g, "+-");
    let pageNumber = (/&pid=(\d+)/).exec(location.href);
    let tags = (/&tags=([^&]*)/).exec(location.href);

    pageNumber = pageNumber === null ? 0 : Math.floor(parseInt(pageNumber[1]) / postsPerPage);
    tags = tags === null ? "" : tags[1];

    if (tags === "all") {
      tags = "";
      blacklistedTags = "";
    }
    return `${apiURL}&tags=${tags}${blacklistedTags}&pid=${pageNumber}`;
  }

  enumerateVisibleThumbs() {
    this.visibleThumbs = Array.from(getAllVisibleThumbs());

    for (let i = 0; i < this.visibleThumbs.length; i += 1) {
      this.enumerateThumb(this.visibleThumbs[i], i);
    }
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Number} index
   */
  enumerateThumb(thumb, index) {
    thumb.setAttribute(Gallery.htmlAttributes.thumbIndex, index);
  }

  /**
   * @param {HTMLElement} thumb
   */
  addEventListenersToThumb(thumb) {
    if (onMobileDevice()) {
      return;
    }
    const image = getImageFromThumb(thumb);

    if (image.onmouseover !== null) {
      return;
    }
    image.onmouseover = (event) => {
      if (this.inGallery || this.recentlyExitedGallery || enteredOverCaptionTag(event)) {
        return;
      }
      this.thumbUnderCursor = thumb;
      this.lastEnteredThumb = thumb;
      this.showOriginalContent(thumb);
    };
    image.onmouseout = (event) => {
      this.thumbUnderCursor = null;

      if (this.inGallery || enteredOverCaptionTag(event)) {
        return;
      }
      this.stopAllVideos();
      this.hideOriginalContent();
    };
  }

  /**
   *
   * @param {HTMLElement} thumb
   */
  openPostInNewPage(thumb) {
    thumb = thumb === undefined ? this.getSelectedThumb() : thumb;
    const firstChild = thumb.children[0];

    if (firstChild.hasAttribute("href")) {
      window.open(firstChild.getAttribute("href"), "_blank");
    } else {
      firstChild.click();
    }
  }

  unFavoriteSelectedContent() {
    if (!userIsOnTheirOwnFavoritesPage()) {
      return;
    }
    const selectedThumb = this.getSelectedThumb();

    if (selectedThumb === null) {
      return;
    }
    const removeFavoriteButton = getRemoveFavoriteButtonFromThumb(selectedThumb);

    if (removeFavoriteButton === null) {
      return;
    }
    const showRemoveFavoriteButtons = document.getElementById("show-remove-favorite-buttons");

    if (showRemoveFavoriteButtons === null) {
      return;
    }

    if (!Gallery.addOrRemoveFavoriteCooldown.ready) {
      return;
    }

    if (!showRemoveFavoriteButtons.checked) {
      showFullscreenIcon(ICONS.warning, 1000);
      setTimeout(() => {
        alert("The \"Remove Buttons\" option must be checked to use this hotkey");
      }, 20);
      return;
    }
    showFullscreenIcon(ICONS.heartMinus);
    removeFavoriteButton.click();
  }

  enterGallery() {
    const selectedThumb = this.getSelectedThumb();

    this.lastSelectedThumbIndexBeforeEnteringGallery = this.currentlySelectedThumbIndex;
    this.background.style.pointerEvents = "auto";

    if (isVideo(selectedThumb)) {
      this.toggleVideoControls(true);
    }
    this.inGallery = true;
    dispatchEvent(new CustomEvent("showOriginalContent", {
      detail: true
    }));
    this.autoplayController.start(selectedThumb);
    Gallery.cursorVisibilityCooldown.restart();
    this.recentlyEnteredGallery = true;
    setTimeout(() => {
      this.recentlyEnteredGallery = false;
    }, 300);
  }

  exitGallery() {
    if (Gallery.settings.debugEnabled) {
      getAllVisibleThumbs().forEach(thumb => thumb.classList.remove("debug-selected"));
    }
    this.toggleCursorVisibility(true);
    this.toggleVideoControls(false);
    this.background.style.pointerEvents = "none";
    const thumbIndex = this.getIndexOfThumbUnderCursor();

    if (thumbIndex !== this.lastSelectedThumbIndexBeforeEnteringGallery) {
      this.hideOriginalContent();

      if (thumbIndex !== null && this.showOriginalContentOnHover) {
        this.showOriginalContent(this.visibleThumbs[thumbIndex]);
      }
    }
    this.recentlyExitedGallery = true;
    setTimeout(() => {
      this.recentlyExitedGallery = false;
    }, 300);
    this.inGallery = false;
    this.autoplayController.stop();
    document.dispatchEvent(new Event("mousemove"));
  }

  /**
   * @param {String} direction
   * @param {Boolean} keyIsHeldDown
   */
  traverseGallery(direction, keyIsHeldDown) {
    if (Gallery.settings.debugEnabled) {
      this.getSelectedThumb().classList.remove("debug-selected");
    }

    if (keyIsHeldDown && !Gallery.keyHeldDownTraversalCooldown.ready) {
      return;
    }

    if (!Gallery.settings.loopAtEndOfGallery && this.reachedEndOfGallery(direction) && Gallery.finishedLoading) {
      this.changedPageInGalleryDirection = direction;
      dispatchEvent(new CustomEvent("reachedEndOfGallery", {
        detail: direction
      }));
      return;
    }
    this.setNextSelectedThumbIndex(direction);
    this.traverseGalleryHelper();
  }

  traverseGalleryHelper() {
    const selectedThumb = this.getSelectedThumb();

    this.autoplayController.startViewTimer(selectedThumb);
    this.clearOriginalContentSources();
    this.stopAllVideos();

    if (Gallery.settings.debugEnabled) {
      selectedThumb.classList.add("debug-selected");
    }
    this.upscaleAnimatedThumbsAround(selectedThumb);
    this.renderImagesAround(selectedThumb);
    this.preloadInactiveVideoPlayers(selectedThumb);

    if (!usingFirefox()) {
      scrollToThumb(selectedThumb.id, false, true);
    }

    if (isVideo(selectedThumb)) {
      this.toggleVideoControls(true);
      this.showOriginalVideo(selectedThumb);
    } else if (isGif(selectedThumb)) {
      this.toggleVideoControls(false);
      this.toggleOriginalVideoContainer(false);
      this.showOriginalGIF(selectedThumb);
    } else {
      this.toggleVideoControls(false);
      this.toggleOriginalVideoContainer(false);
      this.showOriginalImage(selectedThumb);
    }
  }

  /**
   * @param {String} direction
   * @returns {Boolean}
   */
  reachedEndOfGallery(direction) {
    if (direction === Gallery.directions.right && this.currentlySelectedThumbIndex >= this.visibleThumbs.length - 1) {
      return true;
    }

    if (direction === Gallery.directions.left && this.currentlySelectedThumbIndex <= 0) {
      return true;
    }
    return false;
  }

  /**
   * @param {String} direction
   * @returns {Boolean}
   */
  setNextSelectedThumbIndex(direction) {
    if (direction === Gallery.directions.left || direction === Gallery.directions.a) {
      this.currentlySelectedThumbIndex -= 1;
      this.currentlySelectedThumbIndex = this.currentlySelectedThumbIndex < 0 ? this.visibleThumbs.length - 1 : this.currentlySelectedThumbIndex;
    } else {
      this.currentlySelectedThumbIndex += 1;
      this.currentlySelectedThumbIndex = this.currentlySelectedThumbIndex >= this.visibleThumbs.length ? 0 : this.currentlySelectedThumbIndex;
    }
    return false;
  }

  /**
   * @param {Boolean} value
   */
  toggleAllVisibility(value) {
    this.showOriginalContentOnHover = value === undefined ? !this.showOriginalContentOnHover : value;
    this.toggleOriginalContentVisibility(this.showOriginalContentOnHover);

    if (this.thumbUnderCursor !== null) {
      this.toggleBackgroundVisibility();
      this.toggleScrollbarVisibility();
    }
    dispatchEvent(new CustomEvent("showOriginalContent", {
      detail: this.showOriginalContentOnHover
    }));
    setPreference(Gallery.preferences.showOnHover, this.showOriginalContentOnHover);

    const showOnHoverCheckbox = document.getElementById("show-content-on-hover-checkbox");

    if (showOnHoverCheckbox !== null) {
      showOnHoverCheckbox.checked = this.showOriginalContentOnHover;
    }
  }

  hideOriginalContent() {
    this.toggleBackgroundVisibility(false);
    this.toggleScrollbarVisibility(true);
    this.clearOriginalContentSources();
    this.stopAllVideos();
    this.clearMainCanvas();
    this.toggleOriginalVideoContainer(false);
    this.toggleOriginalGIF(false);
  }

  clearOriginalContentSources() {
    this.mainCanvas.style.visibility = "hidden";
    this.lowResolutionCanvas.style.visibility = "hidden";
    this.gifContainer.src = "";
  }

  /**
   * @returns {Boolean}
   */
  currentlyHoveringOverVideoThumb() {
    if (this.thumbUnderCursor === null) {
      return false;
    }
    return isVideo(this.thumbUnderCursor);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Number}
   */
  getIndexFromThumb(thumb) {
    return parseInt(thumb.getAttribute(Gallery.htmlAttributes.thumbIndex));
  }

  /**
   * @param {HTMLElement} thumb
   */
  showOriginalContent(thumb) {
    this.currentlySelectedThumbIndex = this.getIndexFromThumb(thumb);
    this.upscaleAnimatedThumbsAroundDiscrete(thumb);

    if (!this.inGallery && Gallery.settings.renderAroundAggressively) {
      this.renderImagesAround(thumb);
    }

    if (isVideo(thumb)) {
      this.showOriginalVideo(thumb);
    } else if (isGif(thumb)) {
      this.showOriginalGIF(thumb);
    } else {
      this.showOriginalImage(thumb);
    }

    if (this.showOriginalContentOnHover) {
      this.toggleBackgroundVisibility(true);
      this.toggleScrollbarVisibility(false);
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  showOriginalVideo(thumb) {
    if (!this.showOriginalContentOnHover) {
      return;
    }
    this.toggleMainCanvas(false);
    this.videoContainer.style.display = "block";
    this.playOriginalVideo(thumb);

    if (!this.inGallery) {
      this.toggleVideoControls(false);
    }
  }

  /**
   * @param {HTMLElement} initialThumb
   */
  preloadInactiveVideoPlayers(initialThumb) {
    if (!this.inGallery || Gallery.settings.additionalVideoPlayerCount < 1) {
      return;
    }
    this.setActiveVideoPlayer(initialThumb);
    const inactiveVideoPlayers = this.getInactiveVideoPlayers();
    const videoThumbsAroundInitialThumb = this.getAdjacentVideoThumbs(initialThumb, inactiveVideoPlayers.length);
    const loadedVideoSources = new Set(inactiveVideoPlayers
      .map(video => video.src)
      .filter(src => src !== ""));
    const videoSourcesAroundInitialThumb = new Set(videoThumbsAroundInitialThumb.map(thumb => this.getVideoSource(thumb)));
    const videoThumbsNotLoaded = videoThumbsAroundInitialThumb.filter(thumb => !loadedVideoSources.has(this.getVideoSource(thumb)));
    const freeInactiveVideoPlayers = inactiveVideoPlayers.filter(video => !videoSourcesAroundInitialThumb.has(video.src));

    for (let i = 0; i < freeInactiveVideoPlayers.length && i < videoThumbsNotLoaded.length; i += 1) {
      this.setVideoSource(freeInactiveVideoPlayers[i], videoThumbsNotLoaded[i]);
    }
    this.stopAllVideos();
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @returns {HTMLElement[]}
   */
  getAdjacentVideoThumbs(initialThumb, limit) {
    if (Gallery.settings.loopAtEndOfGallery) {
      return this.getAdjacentVideoThumbsOnCurrentPage(initialThumb, limit);
    }
    return this.getAdjacentVideoThumbsThroughoutAllPages(initialThumb, limit);
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @returns {HTMLElement[]}
   */
  getAdjacentVideoThumbsOnCurrentPage(initialThumb, limit) {
    return this.getAdjacentThumbsLooped(
      initialThumb,
      limit,
      (t) => {
        return isVideo(t) && t.id !== initialThumb.id;
      }
    );

  }
  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @returns {HTMLElement[]}
   */
  getAdjacentVideoThumbsThroughoutAllPages(initialThumb, limit) {
    return this.getAdjacentSearchResults(
      initialThumb,
      limit,
      (t) => {
        return isVideo(t) && t.id !== initialThumb.id;
      }
    );
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {String}
   */
  getVideoSource(thumb) {
    return getOriginalImageURLFromThumb(thumb).replace("jpg", "mp4");
  }

  /**
   * @param {HTMLVideoElement} video
   * @param {HTMLElement} thumb
   */
  setVideoSource(video, thumb) {
    if (this.videoPlayerHasSource(video, thumb)) {
      return;
    }
    this.createVideoClip(video, thumb);
    video.src = this.getVideoSource(thumb);
  }

  /**
   * @param {HTMLVideoElement} video
   * @param {HTMLElement} thumb
   */
  createVideoClip(video, thumb) {
    const clip = this.videoClips.get(thumb.id);

    if (clip === undefined) {
      video.ontimeupdate = null;
      return;
    }
    video.ontimeupdate = () => {
      if (video.currentTime < clip.start || video.currentTime > clip.end) {
        video.removeAttribute("controls");
        video.currentTime = clip.start;
      }
    };
  }

  clearVideoSources() {
    for (const video of this.videoPlayers) {
      video.src = "";
    }
  }

  clearInactiveVideoSources() {
    const videoPlayers = this.inGallery ? this.getInactiveVideoPlayers() : this.videoPlayers;

    for (const video of videoPlayers) {
      video.src = "";
    }
  }

  /**
   * @param {HTMLVideoElement} video
   * @returns {String | null}
   */
  getSourceIdFromVideo(video) {
    const regex = /\.mp4\?(\d+)/;
    const match = regex.exec(video.src);

    if (match === null) {
      return null;
    }
    return match[1];
  }

  /**
   * @param {HTMLElement} thumb
   */
  playOriginalVideo(thumb) {
    this.stopAllVideos();
    const video = this.getActiveVideoPlayer();

    this.setVideoSource(video, thumb);
    video.style.display = "block";
    video.play().catch(() => { });
    this.toggleVideoControls(true);
  }

  stopAllVideos() {
    for (const video of this.videoPlayers) {
      this.stopVideo(video);
    }
  }

  stopAllInactiveVideos() {
    for (const video of this.getInactiveVideoPlayers()) {
      this.stopVideo(video);
    }
  }

  /**
   * @param {HTMLVideoElement} video
   */
  stopVideo(video) {
    video.style.display = "none";
    video.pause();
    video.removeAttribute("controls");
  }

  /**
   * @param {HTMLElement} thumb
   */
  showOriginalGIF(thumb) {
    const tags = getTagsFromThumb(thumb);
    const extension = tags.has("animated_png") ? "png" : "gif";
    const originalSource = getOriginalImageURLFromThumb(thumb).replace("jpg", extension);

    this.gifContainer.src = originalSource;

    if (this.showOriginalContentOnHover) {
      this.gifContainer.style.visibility = "visible";
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  showOriginalImage(thumb) {
    if (this.renderIsCompleted(thumb)) {
      this.clearLowResolutionCanvas();
      this.drawMainCanvas(thumb);
    } else if (this.renderHasStarted(thumb)) {
      this.drawLowResolutionCanvas(thumb);
      this.clearMainCanvas();
      this.drawMainCanvas(thumb);
    } else {
      this.drawLowResolutionCanvas(thumb);
      this.renderOriginalImage(thumb);

      if (!this.inGallery && !Gallery.settings.renderAroundAggressively) {
        this.renderImagesAround(thumb);
      }
    }
    this.toggleOriginalContentVisibility(this.showOriginalContentOnHover);
  }

  /**
   * @param {HTMLElement} initialThumb
   */
  renderImagesAround(initialThumb) {
    if (onSearchPage() || (onMobileDevice() && !this.enlargeOnClickOnMobile)) {
      return;
    }
    this.renderImages(this.getAdjacentImageThumbs(initialThumb));
  }

  /**
   * @param {HTMLElement} initialThumb
   * @returns {HTMLElement[]}
   */
  getAdjacentImageThumbs(initialThumb) {
    const adjacentImageThumbs = isImage(initialThumb) ? [initialThumb] : [];

    if (Gallery.settings.loopAtEndOfGallery || this.latestSearchResults.length === 0) {
      return adjacentImageThumbs.concat(this.getAdjacentImageThumbsOnCurrentPage(initialThumb));
    }
    return adjacentImageThumbs.concat(this.getAdjacentImageThumbThroughoutAllPages(initialThumb));
  }

  /**
   * @param {HTMLElement} initialThumb
   * @returns {HTMLElement[]}
   */
  getAdjacentImageThumbsOnCurrentPage(initialThumb) {
    return this.getAdjacentThumbsLooped(
      initialThumb,
      Gallery.settings.maxImagesToRenderAround,
      (thumb) => {
        return isImage(thumb);
      }
    );
  }

  /**
   * @param {HTMLElement} initialThumb
   * @returns {HTMLElement[]}
   */
  getAdjacentImageThumbThroughoutAllPages(initialThumb) {
    return this.getAdjacentSearchResults(
      initialThumb,
      Gallery.settings.maxImagesToRenderAround,
      (thumbNode) => {
        return isImage(thumbNode);
      }
    );
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @param {Function} additionalQualifier
   * @returns {HTMLElement[]}
   */
  getAdjacentThumbs(initialThumb, limit, additionalQualifier) {
    const adjacentThumbs = [];
    let currentThumb = initialThumb;
    let previousThumb = initialThumb;
    let nextThumb = initialThumb;
    let traverseForward = true;

    while (currentThumb !== null && adjacentThumbs.length < limit) {
      if (traverseForward) {
        nextThumb = this.getAdjacentThumb(nextThumb, true);
      } else {
        previousThumb = this.getAdjacentThumb(previousThumb, false);
      }
      traverseForward = this.getTraversalDirection(previousThumb, traverseForward, nextThumb);
      currentThumb = traverseForward ? nextThumb : previousThumb;

      if (currentThumb !== null) {
        if (this.isVisible(currentThumb) && additionalQualifier(currentThumb)) {
          adjacentThumbs.push(currentThumb);
        }
      }
    }
    return adjacentThumbs;
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @param {Function} additionalQualifier
   * @returns {HTMLElement[]}
   */
  getAdjacentThumbsLooped(initialThumb, limit, additionalQualifier) {
    const adjacentThumbs = [];
    const discoveredIds = new Set();
    let currentThumb = initialThumb;
    let previousThumb = initialThumb;
    let nextThumb = initialThumb;
    let traverseForward = true;

    while (currentThumb !== null && adjacentThumbs.length < limit) {
      if (traverseForward) {
        nextThumb = this.getAdjacentThumbLooped(nextThumb, true);
      } else {
        previousThumb = this.getAdjacentThumbLooped(previousThumb, false);
      }
      traverseForward = !traverseForward;
      currentThumb = traverseForward ? nextThumb : previousThumb;

      if (currentThumb === undefined || discoveredIds.has(currentThumb.id)) {
        break;
      }
      discoveredIds.add(currentThumb.id);

      if (this.isVisible(currentThumb) && additionalQualifier(currentThumb)) {
        adjacentThumbs.push(currentThumb);
      }
    }
    return adjacentThumbs;
  }

  /**
   * @param {HTMLElement} previousThumb
   * @param {HTMLElement} traverseForward
   * @param {HTMLElement} nextThumb
   * @returns {Boolean}
   */
  getTraversalDirection(previousThumb, traverseForward, nextThumb) {
    if (previousThumb === null) {
      traverseForward = true;
    } else if (nextThumb === null) {
      traverseForward = false;
    }
    return !traverseForward;
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Boolean} forward
   * @returns {HTMLElement}
   */
  getAdjacentThumbLooped(thumb, forward) {
    let adjacentThumb = this.getAdjacentThumb(thumb, forward);

    while (adjacentThumb !== null && !this.isVisible(adjacentThumb)) {
      adjacentThumb = this.getAdjacentThumb(adjacentThumb, forward);
    }

    if (adjacentThumb === null) {
      adjacentThumb = forward ? this.visibleThumbs[0] : this.visibleThumbs[this.visibleThumbs.length - 1];
    }
    return adjacentThumb;
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Boolean} forward
   * @returns {HTMLElement}
   */
  getAdjacentThumb(thumb, forward) {
    return forward ? thumb.nextElementSibling : thumb.previousElementSibling;
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @param {Function} additionalQualifier
   * @returns {HTMLElement[]}
   */
  getAdjacentSearchResults(initialThumb, limit, additionalQualifier) {
    const initialSearchResultIndex = this.latestSearchResults.findIndex(thumbNode => thumbNode.id === initialThumb.id);

    if (initialSearchResultIndex === -1) {
      return [];
    }
    const adjacentSearchResults = [];
    const discoveredIds = new Set();

    let currentSearchResult;
    let currentIndex;
    let forward = true;
    let previousIndex = initialSearchResultIndex;
    let nextIndex = initialSearchResultIndex;

    while (adjacentSearchResults.length < limit) {
      if (forward) {
        nextIndex = this.getAdjacentSearchResultIndex(nextIndex, true);
        currentIndex = nextIndex;
        forward = false;
      } else {
        previousIndex = this.getAdjacentSearchResultIndex(previousIndex, false);
        currentIndex = previousIndex;
        forward = true;
      }
      currentSearchResult = this.latestSearchResults[currentIndex];

      if (discoveredIds.has(currentSearchResult.id)) {
        break;
      }
      discoveredIds.add(currentSearchResult.id);

      if (additionalQualifier(currentSearchResult)) {
        adjacentSearchResults.push(currentSearchResult);
      }
    }

    for (const searchResult of adjacentSearchResults) {
      searchResult.activateHTMLElement();
    }
    return adjacentSearchResults.map(thumbNode => thumbNode.root);
  }

  /**
   * @param {Number} i
   * @param {Boolean} forward
   * @returns {Number}
   */
  getAdjacentSearchResultIndex(i, forward) {
    if (forward) {
      i += 1;
      i = i >= this.latestSearchResults.length ? 0 : i;
    } else {
      i -= 1;
      i = i < 0 ? this.latestSearchResults.length - 1 : i;
    }
    return i;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Boolean}
   */
  isVisible(thumb) {
    return thumb.style.display !== "none";
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
    return !onMobileDevice() && !onSearchPage() && !this.transferredCanvases.has(thumb.id) && document.getElementById(thumb.id) !== null;
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
      imageURL: getOriginalImageURLFromThumb(thumb),
      id: thumb.id,
      extension: this.getImageExtension(thumb.id),
      fetchDelay: this.getBaseImageFetchDelay(thumb.id),
      thumbURL: getImageFromThumb(thumb).src.replace("us.rule", "rule"),
      pixelCount: this.getPixelCount(thumb),
      resolutionFraction: Gallery.settings.upscaledThumbResolutionFraction
    };

    this.startedRenders.add(thumb.id);

    if (this.canvasIsTransferrable(thumb)) {
      request.canvas = this.getOffscreenCanvasFromThumb(thumb);
    }

    if (onMobileDevice()) {
      request.windowDimensions = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
    return request;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Number}
   */
  getPixelCount(thumb) {
    if (onSearchPage()) {
      return 0;
    }
    const defaultPixelCount = 2073600;
    const pixelCount = ThumbNode.getPixelCount(thumb.id);
    return pixelCount === 0 ? defaultPixelCount : pixelCount;
  }

  /**
   * @param {HTMLElement} thumb
   */
  renderOriginalImage(thumb) {
    if (onSearchPage()) {
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
   * @param {HTMLElement} thumb
   */
  drawMainCanvas(thumb) {
    this.imageRenderer.postMessage({
      action: "drawMainCanvas",
      id: thumb.id
    });
  }

  clearMainCanvas() {
    this.imageRenderer.postMessage({
      action: "clearMainCanvas"
    });
  }

  /**
   * @param {Boolean} value
   */
  toggleOriginalContentVisibility(value) {
    this.toggleMainCanvas(value);
    this.toggleOriginalGIF(value);

    if (!value) {
      this.toggleOriginalVideoContainer(false);
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleBackgroundVisibility(value) {
    if (value === undefined) {
      this.background.style.display = this.background.style.display === "block" ? "none" : "block";
      return;
    }
    this.background.style.display = value ? "block" : "none";
  }

  /**
   * @param {Boolean} value
   */
  toggleBackgroundOpacity(value) {
    if (value !== undefined) {
      if (value) {
        this.updateBackgroundOpacity(1);
      } else {
        this.updateBackgroundOpacity(0);
      }
      return;
    }
    const opacity = parseFloat(this.background.style.opacity);

    if (opacity < 1) {
      this.updateBackgroundOpacity(1);
    } else {
      this.updateBackgroundOpacity(0);
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleScrollbarVisibility(value) {
    if (value === undefined) {
      document.body.style.overflowY = document.body.style.overflowY === "auto" ? "hidden" : "auto";
      return;
    }
    document.body.style.overflowY = value ? "auto" : "hidden";
  }

  /**
   * @param {Boolean} value
   */
  toggleCursorVisibility(value) {
    const html = `
      #original-content-background {
        cursor: ${value ? "auto" : "none"};
      }
    `;

    insertStyleHTML(html, "gallery-cursor-visibility");
  }

  /**
   * @param {Boolean} value
   */
  toggleVideoControls(value) {
    const video = this.getActiveVideoPlayer();

    if (value === undefined) {
      video.style.pointerEvents = video.style.pointerEvents === "auto" ? "none" : "auto";

      if (video.hasAttribute("controls")) {
        video.removeAttribute("controls");
      }
      return;
    }
    video.style.pointerEvents = value ? "auto" : "none";

    if (onMobileDevice()) {
      video.controls = value ? "controls" : false;
    } else if (!value) {
      video.removeAttribute("controls");
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
   * @param {Boolean} value
   */
  toggleOriginalVideoContainer(value) {
    if (value !== undefined) {
      this.videoContainer.style.display = value ? "block" : "none";
      return;
    }

    if (!this.currentlyHoveringOverVideoThumb() || this.videoContainer.style.display === "block") {
      this.videoContainer.style.display = "none";
    } else {
      this.videoContainer.style.display = "block";
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  setActiveVideoPlayer(thumb) {
    for (const video of this.videoPlayers) {
      video.removeAttribute("active");
    }

    for (const video of this.videoPlayers) {
      if (this.videoPlayerHasSource(video, thumb)) {
        video.setAttribute("active", "");
        return;
      }
    }
    this.videoPlayers[0].setAttribute("active", "");
  }
  /**
   * @returns {HTMLVideoElement}
   */
  getActiveVideoPlayer() {
    return this.videoPlayers.find(video => video.hasAttribute("active")) || this.videoPlayers[0];
  }

  /**
   * @param {HTMLVideoElement} video
   * @param {HTMLElement} thumb
   * @returns {Boolean}
   */
  videoPlayerHasSource(video, thumb) {
    return video.src === this.getVideoSource(thumb);
  }

  /**
   * @returns {HTMLVideoElement[]}
   */
  getInactiveVideoPlayers() {
    return this.videoPlayers.filter(video => !video.hasAttribute("active"));
  }

  /**
   * @param {Boolean} value
   */
  toggleOriginalGIF(value) {
    if (value === undefined) {
      this.gifContainer.style.visibility = this.gifContainer.style.visibility === "visible" ? "hidden" : "visible";
    } else {
      this.gifContainer.style.visibility = value ? "visible" : "hidden";
    }
  }

  /**
   * @returns {Number}
   */
  getIndexOfThumbUnderCursor() {
    return this.thumbUnderCursor === null ? null : this.getIndexFromThumb(this.thumbUnderCursor);
  }

  /**
   * @returns {HTMLElement}
   */
  getSelectedThumb() {
    return this.visibleThumbs[this.currentlySelectedThumbIndex];
  }

  /**
   * @param {HTMLElement[]} animatedThumbs
   */
  upscaleAnimatedThumbs(animatedThumbs) {
    if (onMobileDevice()) {
      return;
    }
    const upscaleRequests = [];

    for (const thumb of animatedThumbs) {
      if (!this.canvasIsTransferrable(thumb)) {
        continue;
      }
      let imageURL = getOriginalImageURL(getImageFromThumb(thumb).src);

      if (isGif(thumb)) {
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
   * @param {String} id
   * @returns {Number}
   */
  getBaseImageFetchDelay(id) {
    if (onFavoritesPage() && !Gallery.finishedLoading) {
      return Gallery.settings.throttledImageFetchDelay;
    }

    if (this.extensionIsKnown(id)) {
      return Gallery.settings.imageFetchDelayWhenExtensionKnown;
    }
    return Gallery.settings.imageFetchDelay;
  }

  /**
   * @param {HTMLElement} thumb
   */
  upscaleAnimatedThumbsAround(thumb) {
    if (!onFavoritesPage() || onMobileDevice()) {
      return;
    }
    const animatedThumbsToUpscale = this.getAdjacentThumbs(thumb, Gallery.settings.animatedThumbsToUpscaleRange, (t) => {
      return !isImage(t) && !this.transferredCanvases.has(t.id);
    });

    this.upscaleAnimatedThumbs(animatedThumbsToUpscale);
  }

  /**
   * @param {HTMLElement} thumb
   */
  upscaleAnimatedThumbsAroundDiscrete(thumb) {
    if (!onFavoritesPage() || onMobileDevice()) {
      return;
    }
    const animatedThumbsToUpscale = this.getAdjacentThumbs(thumb, Gallery.settings.animatedThumbsToUpscaleDiscrete, (_) => {
      return true;
    }).filter(t => !isImage(t) && !this.transferredCanvases.has(t.id));

    this.upscaleAnimatedThumbs(animatedThumbsToUpscale);
  }

  /**
   * @param {ThumbNode[]} thumbs
   * @returns {String[]}
   */
  getIdsWithUnknownExtensions(thumbs) {
    return thumbs
      .filter(thumb => isImage(thumb) && !this.extensionIsKnown(thumb.id))
      .map(thumb => thumb.id);
  }

  /**
   * @param {String} id
   */
  drawLowResolutionCanvas(thumb) {
    if (onMobileDevice()) {
      return;
    }
    const image = getImageFromThumb(thumb);

    if (!imageIsLoaded(image)) {
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

  clearLowResolutionCanvas() {
    if (onMobileDevice()) {
      return;
    }
    this.lowResolutionContext.clearRect(0, 0, this.lowResolutionCanvas.width, this.lowResolutionCanvas.height);
  }

  /**
   * @param {Boolean} value
   */
  toggleVideoLooping(value) {
    for (const video of this.videoPlayers) {
      video.toggleAttribute("loop", value);
    }
  }

  loadVideoClips() {
  }

  /**
   * @param {KeyboardEvent} event
   */
  async addFavoriteInGallery(event) {
    if (!this.inGallery || event.repeat || !Gallery.addOrRemoveFavoriteCooldown.ready) {
      return;
    }
    const selectedThumb = this.getSelectedThumb();

    if (selectedThumb === undefined || selectedThumb === null) {
      showFullscreenIcon(ICONS.error);
      return;
    }
    const addedFavoriteStatus = await addFavorite(selectedThumb.id);
    let svg = ICONS.error;

    switch (addedFavoriteStatus) {
      case ADDED_FAVORITE_STATUS.alreadyAdded:
        svg = ICONS.heartCheck;
        break;

      case ADDED_FAVORITE_STATUS.success:
        svg = ICONS.heartPlus;
        dispatchEvent(new CustomEvent("favoriteAddedOrDeleted", {
          detail: selectedThumb.id
        }));
        break;

      default:
        break;
    }
    showFullscreenIcon(svg);
  }
}

const gallery = new Gallery();
