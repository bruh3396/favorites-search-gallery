import { ImageRequest } from "./gallery_image_request";

export class LowResolutionImageRequest extends ImageRequest {

  constructor(item : HTMLElement | ImageRequest) {
    super((item instanceof HTMLElement) ? item : item.thumb);
  }
  public get isHighRes(): boolean {
    return false;
  }
}
