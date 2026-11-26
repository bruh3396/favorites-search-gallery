import { MediaItem } from "@/core/domain/media/media_item";
import { MediaSequencePosition } from "@/core/features/lightbox/navigation/media_sequence_position";

export interface MediaSequence<T extends MediaItem> {
  getNext: (item: T) => Promise<T | undefined>;
  getPrevious: (item: T) => Promise<T | undefined>;
  getNeighbors: (item: T, count: number) => Promise<readonly T[]>;
  positionOf: (item: T) => MediaSequencePosition | undefined;
}
