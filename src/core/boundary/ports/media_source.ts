import { Media } from "@/core/domain/media/media";

export interface MediaSource {
  previewUrl: (media: Media) => Promise<string>;
  originalUrl: (media: Media) => Promise<string>;
  imageUrl: (media: Media) => Promise<string>;
  fetchOriginal: (media: Media, signal?: AbortSignal) => Promise<Blob>;
  fetchDurationSeconds: (media: Media) => Promise<number>;
}
