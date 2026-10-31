import { DEFAULT_LIGHTBOX_KEYMAP } from "@/core/features/lightbox/input/default_lightbox_keymap";
import { composeLightboxDialog } from "@/core/features/lightbox/ui/lightbox_dialog_composer";
import { LightboxActions } from "@/core/features/lightbox/actions/lightbox_actions";
import { LightboxDetails } from "@/core/features/lightbox/details/lightbox_details";
import { LightboxMediaResolver } from "@/core/features/lightbox/stage/lightbox_media_resolver";
import { LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/lightbox_navigation";
import { LightboxRetentionList } from "@/core/features/lightbox/retention_list/lightbox_retention_list";
import { MediaItem } from "@/core/domain/media/media_item";
import { MediaSequence } from "@/core/domain/media/media_sequence";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { StoredValue } from "@/core/utils/stored_value/stored_value";
import { Readable } from "@/core/utils/reactive/signal";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";

const SETTLE_DELAY = 75;
const RETENTION_CAPACITY = 8;

export interface LightboxDependencies<T extends MediaItem> {
  scheduler: Pick<Scheduler, "schedule">;
  sizeObserver: SizeObserver;
  remoteMedia: Pick<RemoteMedia, "resolveMedia" | "resolvePreviewUrl" | "resolveOriginalUrl" | "decodeStill" | "loadOriginal">;
  actions: LightboxActions;
  volume: StoredValue<number>;
  muted: StoredValue<boolean>;
  locateItem: (item: T) => Element | undefined;
  details?: LightboxDetails<T>;
  mode: Readable<LightboxMode>;
}

export interface Lightbox<T extends MediaItem> {
  readonly isOpen: Readable<boolean>;
  readonly settled: Occurrence<T>;
  readonly closed: Occurrence<T>;
  readonly mediaCorrected: Occurrence<MediaItem>;
  open(mediaSequence: MediaSequence<T>, item: T): boolean;
  prefetch(item: T): void;
  createView(): HTMLElement;
  dispose(): void;
}

export function createLightbox<T extends MediaItem>(dependencies: LightboxDependencies<T>): Lightbox<T> {
  const lightboxNavigation = new LightboxNavigation<T>({ settleDelay: SETTLE_DELAY }, dependencies.scheduler);
  const lightboxRetentionList = new LightboxRetentionList<T>({ capacity: RETENTION_CAPACITY }, lightboxNavigation);
  const lightboxMediaResolver = new LightboxMediaResolver(media => dependencies.remoteMedia.resolveMedia(media));
  return {
    isOpen: lightboxNavigation.isOpen,
    settled: lightboxNavigation.settled,
    closed: lightboxNavigation.closed,
    mediaCorrected: lightboxMediaResolver.corrected,
    open: (mediaSequence, item): boolean => {
      if (dependencies.mode.peek() === "off") {
        return false;
      }
      lightboxNavigation.open(mediaSequence, item);
      return true;
    },
    prefetch: (item): void => lightboxRetentionList.retain([item]),
    createView: (): HTMLElement => composeLightboxDialog(
      { keymap: DEFAULT_LIGHTBOX_KEYMAP },
      { ...dependencies, lightboxActions: dependencies.actions, lightboxDetails: dependencies.details, lightboxMediaResolver, lightboxNavigation, retainedItems: lightboxRetentionList.items }
    ),
    dispose: (): void => {
      lightboxRetentionList.dispose();
      lightboxNavigation.dispose();
    }
  };
}
