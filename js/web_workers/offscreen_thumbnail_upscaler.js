/**
 * @param {UpscaleRequest} request
 * @returns {Promise<ImageBitmap>}
 */
async function createImageBitmapFromRequest(request) {
  const response = await fetch(request.imageURL);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

/**
 * @param {UpscaleRequest} request
 * @returns {Promise<ImageBitmap>}
 */
function getImageBitmapFromRequest(request) {
  return request.imageBitmap instanceof ImageBitmap ? Promise.resolve(request.imageBitmap) : createImageBitmapFromRequest(request);
}

/**
 * @param {OffscreenCanvasRenderingContext2D | null} context
 * @param {ImageBitmap} imageBitmap
 */
function drawOffscreenCanvas(context, imageBitmap) {
  if (context === null) {
    return;
  }
  const offscreenCanvas = context.canvas;
  const ratio = Math.min(offscreenCanvas.width / imageBitmap.width, offscreenCanvas.height / imageBitmap.height);
  const centerShiftX = (offscreenCanvas.width - (imageBitmap.width * ratio)) / 2;
  const centerShiftY = (offscreenCanvas.height - (imageBitmap.height * ratio)) / 2;

  context.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  context.drawImage(
    imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height,
    centerShiftX, centerShiftY, imageBitmap.width * ratio, imageBitmap.height * ratio
  );
  imageBitmap.close();
}

/**
 * @param {OffscreenCanvas} offscreenCanvas
 */
function clearOffscreenCanvas(offscreenCanvas) {
  const width = offscreenCanvas.width;
  const height = offscreenCanvas.height;
  const context = offscreenCanvas.getContext("2d");

  if (context instanceof OffscreenCanvasRenderingContext2D) {
    context.clearRect(0, 0, width, height);
  }
  offscreenCanvas.width = 0;
  offscreenCanvas.height = 0;
  setTimeout(() => {
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
  }, 20);
}

/**
 * @param {UpscaleRequest} request
 * @param {ImageBitmap} imageBitmap
 */
function setOffscreenCanvasDimensions(request, imageBitmap) {
  if (request.hasDimensions || request.offscreenCanvas === null) {
    return;
  }
  const maxHeight = SharedGallerySettings.maxUpscaledThumbCanvasHeight;
  const width = imageBitmap.width;
  const height = imageBitmap.height;
  let targetWidth = SharedGallerySettings.upscaledThumbCanvasWidth;
  let targetHeight = (targetWidth / width) * height;

  if (targetWidth > width) {
    targetWidth = width;
    targetHeight = height;
  }

  if (height > maxHeight) {
    targetWidth *= (maxHeight / height);
    targetHeight = maxHeight;
  }
  request.offscreenCanvas.width = targetWidth;
  request.offscreenCanvas.height = targetHeight;
}

class OffscreenThumbUpscaler {
  /** @type {Map<String, OffscreenCanvas>} */
  offscreenCanvases;

  constructor() {
    this.offscreenCanvases = new Map();
  }

  /**
   * @param {MessageEvent<UpscaleMessage>} message
   */
  handleMessage(message) {
    const request = message.data;

    switch (request.action) {
      case "upscale":
        // @ts-ignore
        this.upscale(request.request);
        break;

      case "upscaleMultiple":
        // @ts-ignore
        this.upscaleMultiple(request.requests);
        break;

      case "clear":
        this.clear();
        break;

      default:
        break;
    }
  }

  /**
   * @param {UpscaleRequest[]} requests
   */
  upscaleMultiple(requests) {
    for (const request of requests) {
      this.upscale(request);
    }
    postMessage({
      action: "upscaleMultipleDone"
    });
  }

  /**
   * @param {UpscaleRequest} request
   */
  async upscale(request) {
    const imageBitmap = await getImageBitmapFromRequest(request);

    this.collectOffscreenCanvas(request, imageBitmap);
    this.drawOffscreenCanvas(request, imageBitmap);
  }

  /**
   * @param {UpscaleRequest} request
   * @param {ImageBitmap} imageBitmap
   */
  collectOffscreenCanvas(request, imageBitmap) {
    if (!this.offscreenCanvases.has(request.id) && request.offscreenCanvas !== null) {
      this.offscreenCanvases.set(request.id, request.offscreenCanvas);
      setOffscreenCanvasDimensions(request, imageBitmap);
    }
  }

  /**
   * @param {UpscaleRequest} request
   * @param {ImageBitmap} imageBitmap
   */
  drawOffscreenCanvas(request, imageBitmap) {
    const offscreenCanvas = this.offscreenCanvases.get(request.id);

    if (offscreenCanvas === undefined) {
      return;
    }
    drawOffscreenCanvas(offscreenCanvas.getContext("2d"), imageBitmap);
  }

  clear() {
    for (const offscreenCanvas of this.offscreenCanvases.values()) {
      clearOffscreenCanvas(offscreenCanvas);
    }
  }
}

const upscaler = new OffscreenThumbUpscaler();

onmessage = (message) => {
  upscaler.handleMessage(message);
};
