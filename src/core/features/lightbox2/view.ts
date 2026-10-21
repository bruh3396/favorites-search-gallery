import { LightboxKeymap, createLightboxKeyListener } from "@/core/features/lightbox2/keymap";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { LightboxAutoplay } from "@/core/features/lightbox2/autoplay";
import { currentDocument, h } from "@/core/ui/h/h";
import { LightboxActions } from "@/core/features/lightbox2/actions";
import { LightboxCommandHandlers } from "@/core/features/lightbox2/commands";
import { LightboxDialog } from "@/core/features/lightbox2/ui/dialog";
import { LightboxFullscreen } from "@/core/features/lightbox2/fullscreen";
import { LightboxNavigation } from "@/core/features/lightbox2/navigation";
import { LightboxOverlayVisibility } from "@/core/features/lightbox2/overlay_visibility";
import { LightboxStage } from "@/core/features/lightbox2/stage";
import { LightboxZoom } from "@/core/features/lightbox2/zoom";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { Preference } from "@/core/utils/reactive/preference";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { onCleanup } from "@/core/utils/reactive/scope";

const GIF_CAPACITY = 3;
const VIDEO_CAPACITY = 5;
const OVERLAY_IDLE_DELAY = 750;
const OVERLAY_LEAVE_DELAY = 1_000;
const ZOOM_MINIMUM_SCALE = 2;
const ZOOM_MAXIMUM_SCALE = 8;
const AUTOPLAY_INTERVAL = 3_000;

export interface LightboxViewConfiguration {
  readonly keymap: LightboxKeymap;
}

export interface LightboxViewDependencies<T extends MediaItem> {
  scheduler: Pick<Scheduler, "schedule">;
  sizeObserver: SizeObserver;
  remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl" | "resolveOriginalUrl" | "decodeStill" | "loadOriginal">;
  actions: LightboxActions;
  navigation: Pick<LightboxNavigation<T>, "isOpen" | "currentItem" | "position" | "goToNext" | "goToPrevious" | "close">;
  retainedItems: Readable<readonly T[]>;
  volume: Preference<number>;
  muted: Preference<boolean>;
}

export function createLightboxView<T extends MediaItem>(
  configuration: LightboxViewConfiguration,
  dependencies: LightboxViewDependencies<T>
): HTMLElement {
  const { scheduler, sizeObserver, remoteMedia, actions, navigation, retainedItems, volume, muted } = dependencies;
  const stage = new LightboxStage<T>(
    { gifCapacity: GIF_CAPACITY, videoCapacity: VIDEO_CAPACITY },
    { remoteMedia, currentItem: navigation.currentItem, retainedItems, volume, muted }
  );
  const overlayVisibility = new LightboxOverlayVisibility({ idleDelay: OVERLAY_IDLE_DELAY, leaveDelay: OVERLAY_LEAVE_DELAY }, scheduler);
  const fullscreen = new LightboxFullscreen(currentDocument());
  const zoom = new LightboxZoom(
    { minimumScale: ZOOM_MINIMUM_SCALE, maximumScale: ZOOM_MAXIMUM_SCALE },
    { currentItem: navigation.currentItem, mediaSize: stage.mediaSize }
  );
  const autoplay = new LightboxAutoplay({ interval: AUTOPLAY_INTERVAL }, {
    scheduler,
    isOpen: navigation.isOpen,
    currentItem: navigation.currentItem,
    canCountDown: computed(() => stage.mediaSize.value !== undefined && !zoom.isZoomed.value),
    video: stage.video,
    showNext: (): void => {
      navigation.goToNext().catch(console.error);
    }
  });
  const handlers = bindLightboxCommands({ navigation, stage, fullscreen, zoom, autoplay, actions });

  onCleanup(() => overlayVisibility.dispose());
  effect(() => {
    if (!navigation.isOpen.value) {
      fullscreen.exit();
    }
  });
  return h(LightboxDialog, {
    isOpen: navigation.isOpen,
    currentItem: navigation.currentItem,
    position: navigation.position,
    stage,
    overlayVisibility,
    inFullscreen: fullscreen.inFullscreen,
    zoom,
    autoplay,
    sizeObserver,
    handlers,
    onKeyDown: createLightboxKeyListener(configuration.keymap, handlers),
    resolvePreviewUrl: (media: Media): Promise<string> => remoteMedia.resolvePreviewUrl(media)
  });
}

interface CommandTargets<T extends MediaItem> {
  readonly navigation: Pick<LightboxNavigation<T>, "currentItem" | "goToNext" | "goToPrevious" | "close">;
  readonly stage: Pick<LightboxStage<T>, "togglePause" | "toggleMute">;
  readonly fullscreen: Pick<LightboxFullscreen, "toggle">;
  readonly zoom: Pick<LightboxZoom, "isZoomed" | "toggle" | "zoomOut">;
  readonly autoplay: Pick<LightboxAutoplay, "toggle">;
  readonly actions: LightboxActions;
}

function bindLightboxCommands<T extends MediaItem>(targets: CommandTargets<T>): LightboxCommandHandlers {
  const { navigation, stage, fullscreen, zoom, autoplay, actions } = targets;
  const withCurrentItem = (run: (item: T) => void) => (): void => {
    const item = navigation.currentItem.peek();

    if (item !== undefined) {
      run(item);
    }
  };
  return {
    showNext: (): void => {
      navigation.goToNext().catch(console.error);
    },
    showPrevious: (): void => {
      navigation.goToPrevious().catch(console.error);
    },
    toggleAutoplay: (): void => autoplay.toggle(),
    togglePause: (): void => stage.togglePause(),
    toggleMute: (): void => stage.toggleMute(),
    toggleFullscreen: (): void => fullscreen.toggle(),
    toggleZoom: (): void => zoom.toggle(),
    dismiss: (): void => (zoom.isZoomed.peek() ? zoom.zoomOut() : navigation.close()),
    download: withCurrentItem(item => actions.download(item)),
    openPostPage: withCurrentItem(item => actions.openPostPage(item)),
    openOriginal: withCurrentItem(item => actions.openOriginal(item)),
    close: (): void => navigation.close()
  };
}
