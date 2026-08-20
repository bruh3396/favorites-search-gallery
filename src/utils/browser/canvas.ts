export function drawScaledBitmap(context: CanvasRenderingContext2D | null, bitmap: ImageBitmap): void {
  if (context === null) {
    return;
  }
  const canvas = context.canvas;
  const ratio = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
  const centerShiftX = (canvas.width - (bitmap.width * ratio)) / 2;
  const centerShiftY = (canvas.height - (bitmap.height * ratio)) / 2;

  context.drawImage(
    bitmap, 0, 0, bitmap.width, bitmap.height,
    centerShiftX, centerShiftY, bitmap.width * ratio, bitmap.height * ratio
  );
}

export function clearCanvas(context: CanvasRenderingContext2D | null): void {
  context?.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

export function replaceCanvas(existing: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");

  canvas.className = existing.className;
  existing.replaceWith(canvas);
  return canvas;
}

export function resetCanvas(canvas: HTMLCanvasElement): void {
  clearCanvas(canvas.getContext("2d"));
  canvas.width = 0;
  canvas.height = 0;
}

export function setCanvasDimensions(canvas: HTMLCanvasElement, width: number, height: number, targetWidth: number, maxHeight: number): void {
  let targetHeight = (targetWidth / width) * height;

  if (targetWidth > width) {
    targetWidth = width;
    targetHeight = height;
  }

  if (height > maxHeight) {
    targetWidth *= (maxHeight / height);
    targetHeight = maxHeight;
  }
  canvas.width = targetWidth;
  canvas.height = targetHeight;
}
