import { MediaItem } from "@/core/domain/media/media_item";

export interface LightboxFavorite<T extends MediaItem> {
  isFavorited(item: T): boolean;
  add(item: T): void;
}
