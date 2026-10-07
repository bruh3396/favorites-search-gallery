import { MediaItem } from "@/core/domain/post/post";
import { MediaSequence } from "@/core/contracts/media_sequence";
import { Readable } from "@/core/utils/reactive/signal";

export interface LightboxDependencies<T extends MediaItem> {
  mediaSequence: MediaSequence<T>;
}

export interface LightboxIntents<T extends MediaItem> {
  open: (item: T) => void;
  close: () => void;
  showNext: () => Promise<void>;
  showPrevious: () => Promise<void>;
}

export interface Lightbox<T extends MediaItem> {
  isOpen: Readable<boolean>;
  current: Readable<T | undefined>;
  intents: LightboxIntents<T>;
}
