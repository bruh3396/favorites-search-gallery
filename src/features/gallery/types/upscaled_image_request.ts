import { ImageRequest } from "@/features/gallery/types/image_request";

export class UpscaledImageRequest extends ImageRequest {
  public get isIncomplete(): boolean {
    return false;
  }
}
