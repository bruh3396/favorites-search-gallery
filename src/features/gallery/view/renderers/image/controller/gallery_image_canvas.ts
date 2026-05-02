import { clamp, roundToTwoDecimalPlaces } from "../../../../../../utils/number";
import { clearCanvas, drawScaledCanvas } from "../../../../../../utils/dom/canvas";
import { GallerySettings } from "../../../../../../config/gallery_settings";
import { ON_DESKTOP_DEVICE } from "../../../../../../lib/environment/environment";
import { insertStyle } from "../../../../../../utils/dom/injector";
import { parseDimensions2D } from "../../../../../../utils/string/parse";

const mainCanvas = document.createElement("canvas");
const mainContext = mainCanvas.getContext("2d") ?? new CanvasRenderingContext2D();
const landscapeStyle = `
  .fullscreen-image {
      height: 100vh !important;
      width: auto !important;
  }
  `;
const portraitStyle = `
  .fullscreen-image {
      width: 100vw !important;
      height: auto !important;
  }
  `;
let container: HTMLElement;
const dimensions = parseDimensions2D(GallerySettings.mainCanvasResolution);

mainCanvas.className = "fullscreen-image";
mainCanvas.width = dimensions.x;
mainCanvas.height = dimensions.y;

function insertGalleryCanvas(newContainer: HTMLElement): void {
  newContainer.id = "canvas-container";
  newContainer.className = "fullscreen-image-container";
  newContainer.appendChild(mainCanvas);
  container = newContainer;
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

export function mount(newContainer: HTMLElement): void {
  correctOrientation();
  insertGalleryCanvas(newContainer);
}

export function draw(bitmap: ImageBitmap | null): void {
  if (bitmap !== null) {
    clearCanvas(mainContext);
    drawScaledCanvas(mainContext, bitmap);
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
