import { ImageRequest } from "@/features/gallery/types/image_request";

export class LowResolutionImageRequest extends ImageRequest {

  constructor(item: ImageRequest) {
    super(item.thumb);
  }

  public get isHighRes(): boolean {
    return false;
  }
}
