import { MediaItem } from "@/core/domain/media/media_item";

export interface MediaSequencePosition {
  readonly index: number;
  readonly total: number | undefined;
}

export interface MediaSequence<T extends MediaItem> {
  getNext: (item: T) => Promise<T | undefined>;
  getPrevious: (item: T) => Promise<T | undefined>;
  getNeighbors: (item: T, count: number) => Promise<readonly T[]>;
  positionOf: (item: T) => MediaSequencePosition | undefined;
}
