import { Media } from "@/core/domain/media/media";

export interface MediaItem {
  readonly id: string;
  readonly media: Media;
}
