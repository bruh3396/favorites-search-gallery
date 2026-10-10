import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";

export class BrowserBitmapDecoder implements BitmapDecoder {
  public decode(source: ImageBitmapSource): Promise<ImageBitmap> {
    return createImageBitmap(source);
  }
}
