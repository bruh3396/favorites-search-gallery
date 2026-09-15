import { clamp, roundToTwoDecimalPlaces } from "@/utils/pure/number";
import { clearCanvas, drawScaledBitmap } from "@/utils/browser/canvas";
import { GalleryConfig } from "@/config/gallery_config";
import { ON_DESKTOP_DEVICE } from "@/app/context/environment";
import { setDataset } from "@/utils/browser/dataset";
import { toDimensions2D } from "@/utils/pure/geometry";

export class GalleryImageCanvas {
  private readonly mainCanvas = document.createElement("canvas");
  private readonly mainContext = this.mainCanvas.getContext("2d") ?? new CanvasRenderingContext2D();
  private container: HTMLElement | null = null;

  constructor() {
    const dimensions = toDimensions2D(GalleryConfig.mainCanvasResolution);

    this.mainCanvas.className = "gallery-image";
    this.mainCanvas.width = dimensions.x;
    this.mainCanvas.height = dimensions.y;
  }

  public mount(newContainer: HTMLElement): void {
    this.correctOrientation();
    this.insertGalleryCanvas(newContainer);
  }

  public draw(bitmap: ImageBitmap | null): void {
    if (bitmap !== null) {
      clearCanvas(this.mainContext);
      drawScaledBitmap(this.mainContext, bitmap);
    }
  }

  public clear(): void {
    this.mainContext.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
  }

  public zoomToPoint(x: number, y: number): void {
    if (this.container === null) {
      return;
    }
    const xPercentage = clamp(roundToTwoDecimalPlaces(x / window.innerWidth), 0, 1);
    const yPercentage = clamp(roundToTwoDecimalPlaces(y / window.innerHeight), 0, 1);

    this.container.scrollLeft = (this.container.scrollWidth - this.container.clientWidth) * xPercentage;
    this.container.scrollTop = (this.container.scrollHeight - this.container.clientHeight) * yPercentage;
  }

  public correctOrientation(): void {
    if (ON_DESKTOP_DEVICE) {
      return;
    }
    const usingLandscape = window.screen.orientation.angle === 90 || window.screen.orientation.angle === 270;
    const usingCorrectOrientation = (usingLandscape && this.mainCanvas.width > this.mainCanvas.height) || (!usingLandscape && this.mainCanvas.width < this.mainCanvas.height);

    if (usingCorrectOrientation) {
      return;
    }
    setDataset(this.mainCanvas, "orientation", usingLandscape ? "landscape" : "portrait");
    const tempWidth = this.mainCanvas.width;

    this.mainCanvas.width = this.mainCanvas.height;
    this.mainCanvas.height = tempWidth;
  }

  private insertGalleryCanvas(newContainer: HTMLElement): void {
    newContainer.id = "canvas-container";
    newContainer.className = "gallery-image-frame";
    newContainer.appendChild(this.mainCanvas);
    this.container = newContainer;
  }
}
