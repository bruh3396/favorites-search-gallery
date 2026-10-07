import { MediaItem } from "@/core/domain/post/post";

export interface MediaSequence<T extends MediaItem> {
  getNext: (item: T) => Promise<T | undefined>;
  getPrevious: (item: T) => Promise<T | undefined>;
}
