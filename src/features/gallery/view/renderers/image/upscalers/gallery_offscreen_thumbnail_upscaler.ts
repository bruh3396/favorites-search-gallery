import { OffscreenUpscaleRequest } from "../../../../types/gallery_offscreen_upscale_request";

declare let SharedGallerySettings: {
  maxUpscaledThumbCanvasHeight: number
  upscaledThumbCanvasWidth: number
  onlyCacheImagesInGallery: true
  upscaleUsingSamples: true
};

const OFFSCREEN_CANVASES: Map<string, OffscreenCanvas> = new Map();

async function createImageBitmapFromRequest(request: OffscreenUpscaleRequest): Promise<ImageBitmap> {
  const url = SharedGallerySettings.upscaleUsingSamples ? request.sampleURL : request.imageURL;
  let response = await fetch(url);

  if (!response.ok) {
    response = await fetch(request.imageURL);
  }
  return createImageBitmap(await response.blob());
}

function getImageBitmapFromRequest(request: OffscreenUpscaleRequest): Promise<ImageBitmap> {
  return request.bitmap instanceof ImageBitmap ? Promise.resolve(request.bitmap) : createImageBitmapFromRequest(request);
}

function drawOffscreenCanvas(context: OffscreenCanvasRenderingContext2D | null, bitmap: ImageBitmap): void {
  if (context === null) {
    return;
  }
  const offscreenCanvas = context.canvas;
  const ratio = Math.min(offscreenCanvas.width / bitmap.width, offscreenCanvas.height / bitmap.height);
  const centerShiftX = (offscreenCanvas.width - (bitmap.width * ratio)) / 2;
  const centerShiftY = (offscreenCanvas.height - (bitmap.height * ratio)) / 2;

  // context.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  context.drawImage(
    bitmap, 0, 0, bitmap.width, bitmap.height,
    centerShiftX, centerShiftY, bitmap.width * ratio, bitmap.height * ratio
  );
  bitmap.close();
}

function clearOffscreenCanvas(offscreenCanvas: OffscreenCanvas): void {
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

function setOffscreenCanvasDimensions(request: OffscreenUpscaleRequest, bitmap: ImageBitmap): void {
  if (request.hasDimensions || request.offscreenCanvas === null) {
    return;
  }
  const maxHeight = SharedGallerySettings.maxUpscaledThumbCanvasHeight;
  const width = bitmap.width;
  const height = bitmap.height;
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

function handleMessage(message: MessageEvent<{ action: string, request: OffscreenUpscaleRequest }>): void {
  const request = message.data;

  switch (request.action) {
    case "upscale":
      upscale(request.request);
      break;

    case "clear":
      clear();
      break;

    default:
      break;
  }
}

async function upscale(request: OffscreenUpscaleRequest): Promise<void> {
  const bitmap = await getImageBitmapFromRequest(request);

  collectOffscreenCanvas(request, bitmap);
  drawOffscreenCanvasFromRequest(request, bitmap);
}

function collectOffscreenCanvas(request: OffscreenUpscaleRequest, bitmap: ImageBitmap): void {
  if (!OFFSCREEN_CANVASES.has(request.id) && request.offscreenCanvas !== null) {
    OFFSCREEN_CANVASES.set(request.id, request.offscreenCanvas);
    setOffscreenCanvasDimensions(request, bitmap);
  }
}

function drawOffscreenCanvasFromRequest(request: OffscreenUpscaleRequest, bitmap: ImageBitmap): void {
  const offscreenCanvas = OFFSCREEN_CANVASES.get(request.id);

  if (offscreenCanvas === undefined) {
    return;
  }
  drawOffscreenCanvas(offscreenCanvas.getContext("2d"), bitmap);
}

function clear(): void {
  for (const offscreenCanvas of OFFSCREEN_CANVASES.values()) {
    clearOffscreenCanvas(offscreenCanvas);
  }
}

onmessage = handleMessage;
