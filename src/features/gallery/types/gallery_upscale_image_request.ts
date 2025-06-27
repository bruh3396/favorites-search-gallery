import { ImageRequest } from "./gallery_image_request";

export class UpscaleImageRequest extends ImageRequest {
  public get isIncomplete(): boolean {
    return false;
  }
}
