export interface BitmapDecoder {
  decode: (source: ImageBitmapSource) => Promise<ImageBitmap>;
}
