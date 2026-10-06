import { MediaItem } from "@/core/domain/post/post";

export interface MediaSequence {
  findNext: (item: MediaItem) => Promise<MediaItem | undefined>;
  findPrevious: (item: MediaItem) => Promise<MediaItem | undefined>;
}
