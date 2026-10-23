import { Media } from "@/core/domain/media/media";

export interface RemoteMedia {
  resolvePreviewUrl: (media: Media) => string;
  resolveOriginalUrl: (media: Media) => Promise<string>;
  decodeStill: (media: Media, signal?: AbortSignal, width?: number) => Promise<ImageBitmap>;
  loadOriginal: (media: Media, signal?: AbortSignal) => Promise<HTMLImageElement>;
  fetchOriginal: (media: Media) => Promise<Blob>;
  probeDurationSeconds: (media: Media) => Promise<number>;
}
