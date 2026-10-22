import { LightboxActions } from "@/core/features/lightbox2/actions";
import { LightboxKeymap } from "@/core/features/lightbox2/key_listener";
import { LightboxNavigation } from "@/core/features/lightbox2/navigation";
import { LightboxRetentionList } from "@/core/features/lightbox2/retention_list";
import { MediaItem } from "@/core/domain/post/post";
import { MediaSequence } from "@/core/domain/media/media_sequence";
import { Morpher } from "@/core/boundary/ports/morpher/morpher";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { Preference } from "@/core/utils/reactive/preference";
import { Readable } from "@/core/utils/reactive/signal";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { createLightboxView } from "@/core/features/lightbox2/view";

const SETTLE_DELAY = 75;
const RETENTION_CAPACITY = 8;
const DEFAULT_LIGHTBOX_KEYMAP: LightboxKeymap = {
  ArrowRight: "showNext",
  d: "showNext",
  D: "showNext",
  ArrowLeft: "showPrevious",
  a: "showPrevious",
  A: "showPrevious",
  " ": "toggleAutoplay",
  k: "togglePause",
  K: "togglePause",
  m: "toggleMute",
  M: "toggleMute",
  f: "toggleFullscreen",
  F: "toggleFullscreen",
  z: "toggleZoom",
  Z: "toggleZoom",
  Escape: "dismiss",
  Backspace: "close",
  Delete: "close"
};

export interface LightboxDependencies<T extends MediaItem> {
  scheduler: Pick<Scheduler, "schedule">;
  sizeObserver: SizeObserver;
  remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl" | "resolveOriginalUrl" | "decodeStill" | "loadOriginal">;
  actions: LightboxActions;
  volume: Preference<number>;
  muted: Preference<boolean>;
  morpher?: Morpher;
  locateItem: (item: T) => Element | undefined;
}

export interface Lightbox<T extends MediaItem> {
  readonly isOpen: Readable<boolean>;
  readonly settled: Occurrence<T>;
  readonly closed: Occurrence<T>;
  open(sequence: MediaSequence<T>, item: T): void;
  prefetch(item: T): void;
  createView(): HTMLElement;
  dispose(): void;
}

export function createLightbox<T extends MediaItem>(dependencies: LightboxDependencies<T>): Lightbox<T> {
  const navigation = new LightboxNavigation<T>({ settleDelay: SETTLE_DELAY }, dependencies.scheduler);
  const retentionList = new LightboxRetentionList<T>({ capacity: RETENTION_CAPACITY });
  const stopRetainingSurroundings = keepSurroundingsRetained(navigation, retentionList, RETENTION_CAPACITY);
  return {
    isOpen: navigation.isOpen,
    settled: navigation.settled,
    closed: navigation.closed,
    open: (sequence, item): void => navigation.open(sequence, item),
    prefetch: (item): void => retentionList.retain([item]),
    createView: (): HTMLElement => createLightboxView(
      { keymap: DEFAULT_LIGHTBOX_KEYMAP },
      {
        scheduler: dependencies.scheduler,
        sizeObserver: dependencies.sizeObserver,
        remoteMedia: dependencies.remoteMedia,
        actions: dependencies.actions,
        navigation,
        retainedItems: retentionList.items,
        volume: dependencies.volume,
        muted: dependencies.muted,
        morpher: dependencies.morpher,
        locateItem: dependencies.locateItem
      }
    ),
    dispose: (): void => {
      stopRetainingSurroundings();
      navigation.dispose();
    }
  };
}

function keepSurroundingsRetained<T extends MediaItem>(
  navigation: LightboxNavigation<T>,
  retentionList: LightboxRetentionList<T>, capacity: number
): () => void {
  return navigation.settled.on(item => {
    navigation.sequence.peek()?.getNeighbors(item, capacity - 1)
      .then(neighbors => retentionList.retain([item, ...neighbors]))
      .catch(console.error);
  });
}
