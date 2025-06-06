import { clamp, roundToTwoDecimalPlaces } from "../../../../../../utils/primitive/number";
import { GallerySettings } from "../../../../../../config/gallery_settings";
import { drawScaledCanvasAfterClearing } from "../../../../../../utils/dom/canvas";
import { getDimensions2D } from "../../../../../../utils/primitive/string";

const CANVAS = document.createElement("canvas");
const CONTEXT = CANVAS.getContext("2d") ?? new CanvasRenderingContext2D();
let container: HTMLElement;

function insertGalleryCanvas(newContainer: HTMLElement): void {
  newContainer.id = "canvas-container";
  newContainer.className = "fullscreen-image-container";
  newContainer.appendChild(CANVAS);
  container = newContainer;
}

export function setupGalleryCanvas(newContainer: HTMLElement): void {
  CANVAS.className = "fullscreen-image";
  const dimensions = getDimensions2D(GallerySettings.mainCanvasResolution);

  CANVAS.width = dimensions.width;
  CANVAS.height = dimensions.height;
  insertGalleryCanvas(newContainer);
}

export function draw(bitmap: ImageBitmap | null): void {
  if (bitmap !== null) {
    drawScaledCanvasAfterClearing(CONTEXT, bitmap);
  }
}

export function clear(): void {
  CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
}

export function scrollToZoomPoint(x: number, y: number): void {
  const xPercentage = clamp(roundToTwoDecimalPlaces(x / window.innerWidth), 0, 1);
  const yPercentage = clamp(roundToTwoDecimalPlaces(y / window.innerHeight), 0, 1);

  container.scrollLeft = (container.scrollWidth - container.clientWidth) * xPercentage;
  container.scrollTop = (container.scrollHeight - container.clientHeight) * yPercentage;
}
