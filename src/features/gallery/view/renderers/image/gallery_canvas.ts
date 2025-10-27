import { clamp, roundToTwoDecimalPlaces } from "../../../../../utils/primitive/number";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { ON_DESKTOP_DEVICE } from "../../../../../lib/global/flags/intrinsic_flags";
import { drawScaledCanvasAfterClearing } from "../../../../../utils/dom/canvas_drawer";
import { getDimensions2D } from "../../../../../utils/primitive/string";
import { insertStyleHTML } from "../../../../../utils/dom/style";

const CANVAS = document.createElement("canvas");
const CONTEXT = CANVAS.getContext("2d") ?? new CanvasRenderingContext2D();
const LANDSCAPE_STYLE = `
  .fullscreen-image {
      height: 100vh !important;
      width: auto !important;
  }
  `;
const PORTRAIT_STYLE = `
  .fullscreen-image {
      width: 100vw !important;
      height: auto !important;
  }
  `;

let container: HTMLElement;

function insertGalleryCanvas(newContainer: HTMLElement): void {
  newContainer.id = "canvas-container";
  newContainer.className = "fullscreen-image-container";
  newContainer.appendChild(CANVAS);
  container = newContainer;
}

export function correctOrientation(): void {
  if (ON_DESKTOP_DEVICE) {
    return;
  }
  const usingLandscape = window.screen.orientation.angle === 90 || window.screen.orientation.angle === 270;
  const usingCorrectOrientation = (usingLandscape && CANVAS.width > CANVAS.height) || (!usingLandscape && CANVAS.width < CANVAS.height);

  if (usingCorrectOrientation) {
    return;
  }
  insertStyleHTML(usingLandscape ? LANDSCAPE_STYLE : PORTRAIT_STYLE, "gallery-canvas-orientation");
  const tempWidth = CANVAS.width;

  CANVAS.width = CANVAS.height;
  CANVAS.height = tempWidth;
}

export function setupGalleryCanvas(newContainer: HTMLElement): void {
  CANVAS.className = "fullscreen-image";
  const dimensions = getDimensions2D(GallerySettings.mainCanvasResolution);

  CANVAS.width = dimensions.width;
  CANVAS.height = dimensions.height;
  correctOrientation();
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

export function zoomToPoint(x: number, y: number): void {
  const xPercentage = clamp(roundToTwoDecimalPlaces(x / window.innerWidth), 0, 1);
  const yPercentage = clamp(roundToTwoDecimalPlaces(y / window.innerHeight), 0, 1);

  container.scrollLeft = (container.scrollWidth - container.clientWidth) * xPercentage;
  container.scrollTop = (container.scrollHeight - container.clientHeight) * yPercentage;
}
