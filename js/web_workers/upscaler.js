/**
 * @param {OffscreenCanvasRenderingContext2D | null} context
 * @param {UpscaleRequest} request
 */
function drawOffscreenCanvas(context, request) {
  if (context === null) {
    return;
  }
  const offscreenCanvas = context.canvas;
  const imageBitmap = request.imageBitmap;
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
 */
function setOffscreenCanvasDimensions(request) {
  if (request.hasDimensions || request.offscreenCanvas === null) {
    return;
  }
  const maxHeight = maxUpscaledThumbCanvasHeight;
  const width = request.imageBitmap.width;
  const height = request.imageBitmap.height;
  let targetWidth = upscaledThumbCanvasWidth;
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

class Upscaler {
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
      case "initialize":
        // @ts-ignore
        maxUpscaledThumbCanvasHeight = request.maxHeight;
        // @ts-ignore
        upscaledThumbCanvasWidth = request.width;
        break;

      case "upscale":
        // @ts-ignore
        this.upscale(request);
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
  }

  /**
   * @param {UpscaleRequest} request
   */
  upscale(request) {
    this.collectOffscreenCanvas(request);
    this.drawOffscreenCanvas(request);
  }

  /**
   * @param {UpscaleRequest} request
   */
  collectOffscreenCanvas(request) {
    if (!this.offscreenCanvases.has(request.id) && request.offscreenCanvas !== null) {
      this.offscreenCanvases.set(request.id, request.offscreenCanvas);
      setOffscreenCanvasDimensions(request);
    }
  }

  /**
   * @param {UpscaleRequest} request
   */
  drawOffscreenCanvas(request) {
    const offscreenCanvas = this.offscreenCanvases.get(request.id);

    if (offscreenCanvas === undefined) {
      return;
    }
    drawOffscreenCanvas(offscreenCanvas.getContext("2d"), request);
  }

  clear() {
    for (const offscreenCanvas of this.offscreenCanvases.values()) {
      clearOffscreenCanvas(offscreenCanvas);
    }
  }

}

const upscaler = new Upscaler();
let upscaledThumbCanvasWidth = 600;
let maxUpscaledThumbCanvasHeight = 16000;

onmessage = (message) => {
  upscaler.handleMessage(message);
};
