import { Media } from "@/core/domain/media/media";

export interface RemoteMedia {
  resolvePreviewUrl: (media: Media) => Promise<string>;
  resolveOriginalUrl: (media: Media) => Promise<string>;
  resolveImageUrl: (media: Media) => Promise<string>;
  fetchOriginal: (media: Media, signal?: AbortSignal) => Promise<Blob>;
  fetchDurationSeconds: (media: Media) => Promise<number>;
}
