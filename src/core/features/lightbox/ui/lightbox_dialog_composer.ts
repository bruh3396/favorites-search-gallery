import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { currentDocument, h } from "@/core/ui/h/h";
import { CommandHandlers } from "@/core/ui/hotkeys/command_handlers";
import { Keymap } from "@/core/ui/hotkeys/keymap";
import { LightboxActions } from "@/core/features/lightbox/actions/lightbox_actions";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/lightbox_autoplay";
import { LightboxCloser } from "@/core/features/lightbox/closer/lightbox_closer";
import { LightboxCommand } from "@/core/features/lightbox/input/lightbox_command";
import { LightboxDetails } from "@/core/features/lightbox/details/lightbox_details";
import { LightboxDialog } from "@/core/features/lightbox/ui/lightbox_dialog";
import { LightboxFullscreen } from "@/core/features/lightbox/fullscreen/lightbox_fullscreen";
import { LightboxMediaResolver } from "@/core/features/lightbox/stage/lightbox_media_resolver";
import { LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/lightbox_navigation";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/overlay_visibility/lightbox_overlay_visibility";
import { LightboxStage } from "@/core/features/lightbox/stage/lightbox_stage";
import { LightboxZoom } from "@/core/features/lightbox/zoom/lightbox_zoom";
import { MediaItem } from "@/core/domain/media/media_item";
import { StoredValue } from "@/core/utils/stored_value/stored_value";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { createLightboxCommandHandlers } from "@/core/features/lightbox/input/lightbox_command_handlers";
import { createLightboxKeyListener } from "@/core/features/lightbox/input/lightbox_key_listener";
import { createLightboxMouseListeners } from "@/core/features/lightbox/input/lightbox_mouse_listeners";

const GIF_CAPACITY = 3;
const VIDEO_CAPACITY = 5;
const OVERLAY_IDLE_DELAY = 750;
const OVERLAY_LEAVE_DELAY = 1_000;
const ZOOM_MINIMUM_SCALE = 2;
const ZOOM_MAXIMUM_SCALE = 8;
const AUTOPLAY_INTERVAL = 3_000;
const FULL_MORPH_DURATION = 250;
const SIMPLE_MORPH_DURATION = 120;
const SIMPLE_COMMANDS: ReadonlySet<LightboxCommand> = new Set<LightboxCommand>(["showNext", "showPrevious", "togglePause", "dismiss", "close", "openPostPage", "openOriginal"]);

export interface LightboxDialogConfiguration {
  readonly keymap: Keymap<LightboxCommand>;
}

export interface LightboxDialogDependencies<T extends MediaItem> {
  scheduler: Pick<Scheduler, "schedule">;
  sizeObserver: SizeObserver;
  remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl" | "resolveOriginalUrl" | "decodeStill" | "loadOriginal">;
  lightboxMediaResolver: LightboxMediaResolver;
  lightboxActions: LightboxActions;
  lightboxNavigation: Pick<LightboxNavigation<T>, "isOpen" | "currentItem" | "position" | "goToNext" | "goToPrevious" | "close">;
  retainedItems: Readable<readonly T[]>;
  volume: StoredValue<number>;
  muted: StoredValue<boolean>;
  locateItem: (item: T) => Element | undefined;
  lightboxDetails?: LightboxDetails<T>;
  mode: Readable<LightboxMode>;
}

export function composeLightboxDialog<T extends MediaItem>(
  configuration: LightboxDialogConfiguration,
  dependencies: LightboxDialogDependencies<T>
): HTMLElement {
  const { scheduler, sizeObserver, remoteMedia, lightboxMediaResolver, lightboxActions, lightboxNavigation, retainedItems, volume, muted, locateItem, lightboxDetails, mode } = dependencies;
  const simple = computed(() => mode.value === "simple");
  const lightboxStage = new LightboxStage<T>(
    { gifCapacity: GIF_CAPACITY, videoCapacity: VIDEO_CAPACITY },
    { remoteMedia, lightboxMediaResolver, currentItem: lightboxNavigation.currentItem, retainedItems, volume, muted }
  );
  const lightboxOverlayVisibility = new LightboxOverlayVisibility({ idleDelay: OVERLAY_IDLE_DELAY, leaveDelay: OVERLAY_LEAVE_DELAY }, scheduler);
  const lightboxFullscreen = new LightboxFullscreen(currentDocument());
  const lightboxZoom = new LightboxZoom(
    { minimumScale: ZOOM_MINIMUM_SCALE, maximumScale: ZOOM_MAXIMUM_SCALE },
    { currentItem: lightboxNavigation.currentItem, mediaSize: lightboxStage.mediaSize, enabled: computed(() => !simple.value) }
  );
  const lightboxAutoplay = new LightboxAutoplay({ interval: AUTOPLAY_INTERVAL }, {
    scheduler,
    lightboxNavigation,
    canCountDown: computed(() => lightboxStage.mediaSize.value !== undefined && !lightboxZoom.isZoomed.value),
    video: lightboxStage.video
  });
  const lightboxCloser = new LightboxCloser<T>({
    lightboxNavigation,
    shownMedia: lightboxStage.shownMedia,
    inFullscreen: lightboxFullscreen.inFullscreen,
    morphDuration: computed(() => (simple.value ? SIMPLE_MORPH_DURATION : FULL_MORPH_DURATION)),
    locateItem
  });
  const handlers = limitToSimpleCommands(createLightboxCommandHandlers({ lightboxNavigation, lightboxStage, lightboxFullscreen, lightboxZoom, lightboxAutoplay, lightboxCloser, lightboxActions, lightboxDetails }), simple);

  effect(() => {
    if (!lightboxNavigation.isOpen.value) {
      lightboxFullscreen.exit();
    }
  });
  return h(LightboxDialog, {
    isOpen: lightboxNavigation.isOpen,
    position: lightboxNavigation.position,
    currentItem: lightboxNavigation.currentItem,
    lightboxDetails,
    simple,
    closesOnPress: computed(() => simple.value && lightboxStage.video.value === undefined),
    lightboxStage,
    lightboxOverlayVisibility,
    inFullscreen: lightboxFullscreen.inFullscreen,
    lightboxZoom,
    lightboxAutoplay,
    sizeObserver,
    handlers,
    keymap: configuration.keymap,
    onKeydown: createLightboxKeyListener(configuration.keymap, handlers),
    lightboxMouseListeners: createLightboxMouseListeners(handlers)
  });
}

function limitToSimpleCommands(handlers: CommandHandlers<LightboxCommand>, simple: Readable<boolean>): CommandHandlers<LightboxCommand> {
  const entries = Object.entries(handlers) as Array<[LightboxCommand, () => void]>;
  return Object.fromEntries(entries.map(([lightboxCommand, run]) => [
    lightboxCommand, (): void => {
      if (!simple.peek() || SIMPLE_COMMANDS.has(lightboxCommand)) {
        run();
      }
    }
  ])) as CommandHandlers<LightboxCommand>;
}
