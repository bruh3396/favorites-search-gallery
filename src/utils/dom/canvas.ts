export function drawScaledCanvas(context: CanvasRenderingContext2D | null, bitmap: ImageBitmap): void {
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
