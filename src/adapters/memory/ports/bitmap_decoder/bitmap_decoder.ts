import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";

export class MemoryBitmapDecoder implements BitmapDecoder {
  public decode(): Promise<ImageBitmap> {
    return Promise.resolve({ width: 1, height: 1, close: (): void => undefined } as ImageBitmap);
  }
}
