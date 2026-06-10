import { GalleryConfig } from "@/config/gallery_config";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { convertImageUrlToSampleUrl } from "@/lib/media/url_transformer";
import { isImage } from "@/lib/media/type_predicates";
import { resolveImageUrl } from "@/lib/media/url_resolver";

export const transferredCanvasIds = new Set<string>();

export async function getUpscaleRequest(imageRequest: ImageRequest): Promise<OffscreenUpscaleRequest> {
  const bitmapClone = await cloneImageBitmap(imageRequest);
  const imageUrl = await resolveImageUrl(imageRequest.thumb);
  return new OffscreenUpscaleRequest(imageRequest.thumb, bitmapClone, imageUrl);
}

export class OffscreenUpscaleRequest {
  public id: string;
  public action: string;
  public hasDimensions: boolean;
  public offscreenCanvas: OffscreenCanvas | null;
  public bitmap: ImageBitmap | null;
  public imageUrl: string;
  public sampleUrl: string;

  constructor(thumb: HTMLElement, bitmap: ImageBitmap | null, imageUrl: string) {
    this.id = thumb.id;
    this.action = "upscale";
    this.hasDimensions = false;
    this.offscreenCanvas = this.getOffscreenCanvas(thumb);
    this.bitmap = bitmap;
    this.imageUrl = imageUrl;
    this.sampleUrl = isImage(thumb) ? convertImageUrlToSampleUrl(imageUrl) : imageUrl;
  }

  public get transferable(): OffscreenCanvas[] {
    return this.offscreenCanvas === null ? [] : [this.offscreenCanvas];
  }

  public getOffscreenCanvas(thumb: HTMLElement): OffscreenCanvas | null {
    if (transferredCanvasIds.has(this.id)) {
      return null;
    }
    transferredCanvasIds.add(this.id);
    const canvas = thumb.querySelector("canvas");

    if (canvas === null) {
      throw new Error("Tried to create upscale request with null canvas");
    }
    this.hasDimensions = canvas.dataset.size !== undefined;
    return canvas.transferControlToOffscreen();
  }
}

function cloneImageBitmap(imageRequest: ImageRequest): Promise<ImageBitmap | null> {
  if (GalleryConfig.fetchImageBitmapsInWorker) {
    return Promise.resolve(null);
  }

  if (!(imageRequest.bitmap instanceof ImageBitmap)) {
    throw new Error("Tried to create upscale request without image bitmap");
  }
  return createImageBitmap(imageRequest.bitmap);
}
