import { MediaItem } from "@/core/domain/media/media_item";

export interface LightboxActions {
  openPostPage(item: MediaItem): void;
  openOriginal(item: MediaItem): void;
  download(item: MediaItem): void;
}
