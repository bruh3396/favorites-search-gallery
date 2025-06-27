import { ImageRequest } from "./gallery_image_request";

export class LowResolutionImageRequest extends ImageRequest {
  public get isOriginalResolution(): boolean {
    return false;
  }
}
