type UpscaleConfig = {
  upscaledCanvasWidth: number;
  maxUpscaledCanvasHeight: number;
}

type UpscaleCommand =
  | { action: "init"; config: UpscaleConfig }
  | { action: "upscale"; id: string; url: string; canvas?: OffscreenCanvas }
  | { action: "evict"; id: string }

const canvases: Map<string, OffscreenCanvas> = new Map();
let config: UpscaleConfig = { upscaledCanvasWidth: 600, maxUpscaledCanvasHeight: 16_000 };

self.onmessage = (event: MessageEvent<UpscaleCommand>): void => {
  const message = event.data;

  switch (message.action) {
    case "init":
      config = message.config;
      break;

    case "upscale":
      upscale(message.id, message.url, message.canvas);
      break;

    case "evict":
      evict(message.id);
      break;
    default:
      break;
  }
};

async function upscale(id: string, url: string, canvas?: OffscreenCanvas): Promise<void> {
  if (canvas !== undefined) {
    canvases.set(id, canvas);
  }
  const target = canvases.get(id);

  if (target === undefined) {
    return;
  }
  const bitmap = await fetchBitmap(url, config.upscaledCanvasWidth);

  if (bitmap === null) {
    return;
  }
  draw(target, bitmap);
  bitmap.close();
}

function evict(id: string): void {
  const canvas = canvases.get(id);

  if (canvas === undefined) {
    return;
  }
  canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 0;
  canvas.height = 0;
  canvases.delete(id);
}

async function fetchBitmap(url: string, resizeWidth: number): Promise<ImageBitmap | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await createImageBitmap(blob, { resizeWidth, resizeQuality: "high" });
  } catch {
    return null;
  }
}

function draw(canvas: OffscreenCanvas, bitmap: ImageBitmap): void {
  setCanvasDimensions(canvas, bitmap.width, bitmap.height);
  const context = canvas.getContext("2d");

  if (context === null) {
    return;
  }
  const ratio = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
  const centerShiftX = (canvas.width - (bitmap.width * ratio)) / 2;
  const centerShiftY = (canvas.height - (bitmap.height * ratio)) / 2;

  context.drawImage(
    bitmap, 0, 0, bitmap.width, bitmap.height,
    centerShiftX, centerShiftY, bitmap.width * ratio, bitmap.height * ratio
  );
}

function setCanvasDimensions(canvas: OffscreenCanvas, width: number, height: number): void {
  let targetWidth = width;
  let targetHeight = height;

  if (height > config.maxUpscaledCanvasHeight) {
    targetWidth *= (config.maxUpscaledCanvasHeight / height);
    targetHeight = config.maxUpscaledCanvasHeight;
  }
  canvas.width = targetWidth;
  canvas.height = targetHeight;
}
