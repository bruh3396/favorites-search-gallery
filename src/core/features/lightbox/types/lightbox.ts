import { MediaItem } from "@/core/domain/post/post";
import { MediaSequence } from "@/core/features/lightbox/types/media_sequence";
import { Readable } from "@/core/utils/reactive/signal";

export interface LightboxDependencies {
  mediaSequence: MediaSequence;
}

export interface LightboxIntents {
  open: (post: MediaItem) => void;
  close: () => void;
  showNext: () => Promise<void>;
  showPrevious: () => Promise<void>;
}

export interface Lightbox {
  isOpen: Readable<boolean>;
  current: Readable<MediaItem | undefined>;
  intents: LightboxIntents;
}
