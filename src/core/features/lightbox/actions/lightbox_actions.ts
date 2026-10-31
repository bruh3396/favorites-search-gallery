import { MediaItem } from "@/core/domain/media/media_item";

export interface LightboxActions {
  openPostPage(mediaItem: MediaItem): void;
  openOriginal(mediaItem: MediaItem): void;
  download(mediaItem: MediaItem): void;
}
