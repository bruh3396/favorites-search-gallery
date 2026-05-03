import { ImageRequest } from "./gallery_image_request";

export class LowResolutionImageRequest extends ImageRequest {

  constructor(item: ImageRequest) {
    super(item.thumb);
  }

  public get isHighRes(): boolean {
    return false;
  }
}
