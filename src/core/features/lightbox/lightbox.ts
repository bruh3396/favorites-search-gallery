import { DEFAULT_LIGHTBOX_KEYMAP } from "@/core/features/lightbox/input/keymap";
import { LightboxActions } from "@/core/features/lightbox/actions";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/navigation";
import { LightboxRetentionList } from "@/core/features/lightbox/navigation/retention_list";
import { MediaItem } from "@/core/domain/post/post";
import { MediaSequence } from "@/core/domain/media/media_sequence";
import { Morpher } from "@/core/boundary/ports/morpher/morpher";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { Preference } from "@/core/utils/reactive/preference";
import { Readable } from "@/core/utils/reactive/signal";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { createLightboxView } from "@/core/features/lightbox/view";

export { default as LIGHTBOX_STYLES } from "@/core/features/lightbox/styles.css?inline";

const SETTLE_DELAY = 75;
const RETENTION_CAPACITY = 8;

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
  const retentionList = new LightboxRetentionList<T>({ capacity: RETENTION_CAPACITY }, navigation);
  return {
    isOpen: navigation.isOpen,
    settled: navigation.settled,
    closed: navigation.closed,
    open: (sequence, item): void => navigation.open(sequence, item),
    prefetch: (item): void => retentionList.retain([item]),
    createView: (): HTMLElement => createLightboxView(
      { keymap: DEFAULT_LIGHTBOX_KEYMAP },
      { ...dependencies, navigation, retainedItems: retentionList.items }
    ),
    dispose: (): void => {
      retentionList.dispose();
      navigation.dispose();
    }
  };
}
