import { ImageRequest } from "./image_request";

export class UpscaledImageRequest extends ImageRequest {
  public get isIncomplete(): boolean {
    return false;
  }
}
