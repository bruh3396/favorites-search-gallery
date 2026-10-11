import { MediaItem } from "./media";

export interface SequencePosition {
  readonly index: number;
  readonly total: number | undefined;
}

export interface MediaSequence<T extends MediaItem> {
  getNext: (item: T) => Promise<T | undefined>;
  getPrevious: (item: T) => Promise<T | undefined>;
  positionOf: (item: T) => SequencePosition | undefined;
}
