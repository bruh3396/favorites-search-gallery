export function drawScaledCanvas(context: CanvasRenderingContext2D | null, imageBitmap: ImageBitmap): void {
  if (context === null) {
    return;
  }
  const canvas = context.canvas;
  const ratio = Math.min(canvas.width / imageBitmap.width, canvas.height / imageBitmap.height);
  const centerShiftX = (canvas.width - (imageBitmap.width * ratio)) / 2;
  const centerShiftY = (canvas.height - (imageBitmap.height * ratio)) / 2;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height,
    centerShiftX, centerShiftY, imageBitmap.width * ratio, imageBitmap.height * ratio
  );
}
