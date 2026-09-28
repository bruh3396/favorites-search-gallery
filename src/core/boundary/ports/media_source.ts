import { Media } from "@/core/domain/media/media";

export interface MediaSource {
  previewUrl: (media: Media) => Promise<string>;
  originalUrl: (media: Media) => Promise<string>;
  originalBlob: (media: Media, signal?: AbortSignal) => Promise<Blob>;
  duration: (media: Media) => Promise<number>;
}
