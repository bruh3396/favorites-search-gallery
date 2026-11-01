import { DEFAULT_LIGHTBOX_KEYMAP } from "@/core/features/lightbox/input/default_lightbox_keymap";
import { LightboxActions } from "@/core/features/lightbox/actions/lightbox_actions";
import { LightboxDetails } from "@/core/features/lightbox/details/lightbox_details";
import { LightboxMediaResolver } from "@/core/features/lightbox/stage/lightbox_media_resolver";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/lightbox_navigation";
import { LightboxPreferences } from "@/core/features/lightbox/lightbox_preferences";
import { LightboxRetentionList } from "@/core/features/lightbox/retention_list/lightbox_retention_list";
import { MediaItem } from "@/core/domain/media/media_item";
import { MediaSequence } from "@/core/domain/media/media_sequence";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { Readable } from "@/core/utils/reactive/signal";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { Viewport } from "@/core/boundary/ports/viewport/viewport";
import { composeLightboxDialog } from "@/core/features/lightbox/ui/lightbox_dialog_composer";

const SETTLE_DELAY = 75;
const RETENTION_CAPACITY = 8;

export interface LightboxDependencies<T extends MediaItem> {
  scheduler: Pick<Scheduler, "schedule" | "requestFrame">;
  sizeObserver: SizeObserver;
  viewport: Pick<Viewport, "readDevicePixelRatio">;
  remoteMedia: Pick<RemoteMedia, "resolveMedia" | "resolvePreviewUrl" | "resolveOriginalUrl" | "decodeStill" | "loadOriginal">;
  actions: LightboxActions;
  preferences: LightboxPreferences;
  locateItem: (item: T) => Element | undefined;
  details?: LightboxDetails<T>;
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
      if (dependencies.preferences.mode.peek() === "off") {
        return false;
      }
      lightboxNavigation.open(mediaSequence, item);
      return true;
    },
    prefetch: (item): void => lightboxRetentionList.retain([item]),
    createView: (): HTMLElement => composeLightboxDialog(
      { keymap: DEFAULT_LIGHTBOX_KEYMAP },
      {
        ...dependencies,
        lightboxActions: dependencies.actions,
        lightboxDetails: dependencies.details,
        lightboxPreferences: dependencies.preferences,
        lightboxMediaResolver,
        lightboxNavigation,
        retainedItems: lightboxRetentionList.items
      }
    ),
    dispose: (): void => {
      lightboxRetentionList.dispose();
      lightboxNavigation.dispose();
    }
  };
}
