import { GallerySettings } from "../../../config/gallery_settings";
import { ImageRequest } from "./gallery_image_request";
import { convertImageURLToSampleURL } from "../../../utils/content/image_url";
import { getOriginalImageURL } from "../../../lib/api/media_api";

export const TRANSFERRED_CANVAS_IDS = new Set<string>();

function getImageBitmapClone(imageRequest: ImageRequest): Promise<ImageBitmap | null> {
  if (GallerySettings.fetchImageBitmapsInWorker) {
    return Promise.resolve(null);
  }

  if (!(imageRequest.bitmap instanceof ImageBitmap)) {
    throw new Error("Tried to create upscale request without image bitmap");
  }
  return createImageBitmap(imageRequest.bitmap);
}

export async function getUpscaleRequest(imageRequest: ImageRequest): Promise<UpscaleRequest> {
  const bitmapClone = await getImageBitmapClone(imageRequest);
  const imageURL = await getOriginalImageURL(imageRequest.thumb);
  return new UpscaleRequest(imageRequest.thumb, bitmapClone, imageURL);
}

export class UpscaleRequest {
  public id: string;
  public action: string;
  public hasDimensions: boolean;
  public offscreenCanvas: OffscreenCanvas | null;
  public bitmap: ImageBitmap | null;
  public imageURL: string;
  public sampleURL: string;

  constructor(thumb: HTMLElement, bitmap: ImageBitmap | null, imageURL: string) {
    this.id = thumb.id;
    this.action = "upscale";
    this.hasDimensions = false;
    this.offscreenCanvas = this.getOffscreenCanvas(thumb);
    this.bitmap = bitmap;
    this.imageURL = imageURL;
    this.sampleURL = convertImageURLToSampleURL(imageURL);
  }

  public get transferable(): OffscreenCanvas[] {
    return this.offscreenCanvas === null ? [] : [this.offscreenCanvas];
  }

  public getOffscreenCanvas(thumb: HTMLElement): OffscreenCanvas | null {
    if (TRANSFERRED_CANVAS_IDS.has(this.id)) {
      return null;
    }
    TRANSFERRED_CANVAS_IDS.add(this.id);
    const canvas = thumb.querySelector("canvas");

    if (canvas === null) {
      throw new Error("Tried to create upscale request with null canvas");
    }
    this.hasDimensions = canvas.dataset.size !== undefined;
    return canvas.transferControlToOffscreen();
  }
}
