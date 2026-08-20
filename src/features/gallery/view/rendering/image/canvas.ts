import { clamp, roundToTwoDecimalPlaces } from "@/utils/pure/number";
import { clearCanvas, drawScaledBitmap } from "@/utils/browser/canvas";
import { GalleryConfig } from "@/config/gallery_config";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { insertStyle } from "@/utils/browser/injector";
import { toDimensions2D } from "@/utils/pure/geometry";

const mainCanvas = document.createElement("canvas");
const mainContext = mainCanvas.getContext("2d") ?? new CanvasRenderingContext2D();
const landscapeStyle = `
  .gallery-image {
      height: 100vh !important;
      width: auto !important;
  }
  `;
const portraitStyle = `
  .gallery-image {
      width: 100vw !important;
      height: auto !important;
  }
  `;
let container: HTMLElement;
const dimensions = toDimensions2D(GalleryConfig.mainCanvasResolution);

mainCanvas.className = "gallery-image";
mainCanvas.width = dimensions.x;
mainCanvas.height = dimensions.y;

export function mount(newContainer: HTMLElement): void {
  correctOrientation();
  insertGalleryCanvas(newContainer);
}

export function draw(bitmap: ImageBitmap | null): void {
  if (bitmap !== null) {
    clearCanvas(mainContext);
    drawScaledBitmap(mainContext, bitmap);
  }
}

export function clear(): void {
  mainContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
}

export function zoomToPoint(x: number, y: number): void {
  const xPercentage = clamp(roundToTwoDecimalPlaces(x / window.innerWidth), 0, 1);
  const yPercentage = clamp(roundToTwoDecimalPlaces(y / window.innerHeight), 0, 1);

  container.scrollLeft = (container.scrollWidth - container.clientWidth) * xPercentage;
  container.scrollTop = (container.scrollHeight - container.clientHeight) * yPercentage;
}

export function correctOrientation(): void {
  if (ON_DESKTOP_DEVICE) {
    return;
  }
  const usingLandscape = window.screen.orientation.angle === 90 || window.screen.orientation.angle === 270;
  const usingCorrectOrientation = (usingLandscape && mainCanvas.width > mainCanvas.height) || (!usingLandscape && mainCanvas.width < mainCanvas.height);

  if (usingCorrectOrientation) {
    return;
  }
  insertStyle(usingLandscape ? landscapeStyle : portraitStyle, "gallery-canvas-orientation");
  const tempWidth = mainCanvas.width;

  mainCanvas.width = mainCanvas.height;
  mainCanvas.height = tempWidth;
}

function insertGalleryCanvas(newContainer: HTMLElement): void {
  newContainer.id = "canvas-container";
  newContainer.className = "gallery-image-frame";
  newContainer.appendChild(mainCanvas);
  container = newContainer;
}
