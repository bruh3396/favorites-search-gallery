import { LightboxKeymap, createLightboxKeyListener } from "@/core/features/lightbox/input/key_listener";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { currentDocument, h } from "@/core/ui/h/h";
import { LightboxActions } from "@/core/features/lightbox/actions/actions";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/autoplay";
import { LightboxCloser } from "@/core/features/lightbox/closer/closer";
import { LightboxDetails } from "@/core/features/lightbox/details/details";
import { LightboxDialog } from "@/core/features/lightbox/ui/dialog";
import { LightboxFullscreen } from "@/core/features/lightbox/fullscreen/fullscreen";
import { LightboxMediaResolver } from "@/core/features/lightbox/stage/media_resolver";
import { LightboxMode } from "@/core/features/lightbox/mode";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/navigation";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/overlay_visibility/overlay_visibility";
import { LightboxStage } from "@/core/features/lightbox/stage/stage";
import { LightboxZoom } from "@/core/features/lightbox/zoom/zoom";
import { MediaItem } from "@/core/domain/post/post";
import { Preference } from "@/core/utils/reactive/preference";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { createLightboxCommandHandlers } from "@/core/features/lightbox/input/command_handlers";
import { createLightboxMouseListeners } from "@/core/features/lightbox/input/mouse_listeners";
import { limitToSimpleCommands } from "@/core/features/lightbox/input/simple_commands";

const GIF_CAPACITY = 3;
const VIDEO_CAPACITY = 5;
const OVERLAY_IDLE_DELAY = 750;
const OVERLAY_LEAVE_DELAY = 1_000;
const ZOOM_MINIMUM_SCALE = 2;
const ZOOM_MAXIMUM_SCALE = 8;
const AUTOPLAY_INTERVAL = 3_000;
const FULL_MORPH_DURATION = 250;
const SIMPLE_MORPH_DURATION = 120;

export interface LightboxViewConfiguration {
  readonly keymap: LightboxKeymap;
}

export interface LightboxViewDependencies<T extends MediaItem> {
  scheduler: Pick<Scheduler, "schedule">;
  sizeObserver: SizeObserver;
  remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl" | "resolveOriginalUrl" | "decodeStill" | "loadOriginal">;
  resolver: LightboxMediaResolver;
  actions: LightboxActions;
  navigation: Pick<LightboxNavigation<T>, "isOpen" | "currentItem" | "position" | "goToNext" | "goToPrevious" | "close">;
  retainedItems: Readable<readonly T[]>;
  volume: Preference<number>;
  muted: Preference<boolean>;
  locateItem: (item: T) => Element | undefined;
  details?: LightboxDetails<T>;
  mode: Readable<LightboxMode>;
}

export function createLightboxView<T extends MediaItem>(
  configuration: LightboxViewConfiguration,
  dependencies: LightboxViewDependencies<T>
): HTMLElement {
  const { scheduler, sizeObserver, remoteMedia, resolver, actions, navigation, retainedItems, volume, muted, locateItem, details, mode } = dependencies;
  const simple = computed(() => mode.value === "simple");
  const full = computed(() => !simple.value);
  const stage = new LightboxStage<T>(
    { gifCapacity: GIF_CAPACITY, videoCapacity: VIDEO_CAPACITY },
    { remoteMedia, resolver, currentItem: navigation.currentItem, retainedItems, volume, muted }
  );
  const overlayVisibility = new LightboxOverlayVisibility({ idleDelay: OVERLAY_IDLE_DELAY, leaveDelay: OVERLAY_LEAVE_DELAY }, scheduler);
  const fullscreen = new LightboxFullscreen(currentDocument());
  const zoom = new LightboxZoom(
    { minimumScale: ZOOM_MINIMUM_SCALE, maximumScale: ZOOM_MAXIMUM_SCALE },
    { currentItem: navigation.currentItem, mediaSize: stage.mediaSize, enabled: full }
  );
  const autoplay = new LightboxAutoplay({ interval: AUTOPLAY_INTERVAL }, {
    scheduler,
    navigation,
    canCountDown: computed(() => stage.mediaSize.value !== undefined && !zoom.isZoomed.value),
    video: stage.video
  });
  const closer = new LightboxCloser<T>({
    navigation,
    shownMedia: stage.shownMedia,
    inFullscreen: fullscreen.inFullscreen,
    morphDuration: computed(() => (simple.value ? SIMPLE_MORPH_DURATION : FULL_MORPH_DURATION)),
    locateItem
  });
  const handlers = limitToSimpleCommands(createLightboxCommandHandlers({ navigation, stage, fullscreen, zoom, autoplay, closer, actions, details }), simple);

  effect(() => {
    if (!navigation.isOpen.value) {
      fullscreen.exit();
    }
  });
  return h(LightboxDialog, {
    isOpen: navigation.isOpen,
    position: navigation.position,
    currentItem: navigation.currentItem,
    details,
    simple,
    stage,
    overlayVisibility,
    inFullscreen: fullscreen.inFullscreen,
    zoom,
    autoplay,
    sizeObserver,
    handlers,
    keymap: configuration.keymap,
    keyListener: createLightboxKeyListener(configuration.keymap, handlers),
    mouseListeners: createLightboxMouseListeners(handlers)
  });
}
