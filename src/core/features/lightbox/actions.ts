import { MediaItem } from "@/core/domain/post/post";

export interface LightboxActions {
  openPostPage(item: MediaItem): void;
  openOriginal(item: MediaItem): void;
  download(item: MediaItem): void;
}
