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
  resolver: LightboxMediaResolver;
  actions: LightboxActions;
  navigation: Pick<LightboxNavigation<T>, "isOpen" | "currentItem" | "position" | "goToNext" | "goToPrevious" | "close">;
  retainedItems: Readable<readonly T[]>;
  volume: StoredValue<number>;
  muted: StoredValue<boolean>;
  locateItem: (item: T) => Element | undefined;
  details?: LightboxDetails<T>;
  mode: Readable<LightboxMode>;
}

export function composeLightboxDialog<T extends MediaItem>(
  configuration: LightboxDialogConfiguration,
  dependencies: LightboxDialogDependencies<T>
): HTMLElement {
  const { scheduler, sizeObserver, remoteMedia, resolver, actions, navigation, retainedItems, volume, muted, locateItem, details, mode } = dependencies;
  const simple = computed(() => mode.value === "simple");
  const stage = new LightboxStage<T>(
    { gifCapacity: GIF_CAPACITY, videoCapacity: VIDEO_CAPACITY },
    { remoteMedia, resolver, currentItem: navigation.currentItem, retainedItems, volume, muted }
  );
  const overlayVisibility = new LightboxOverlayVisibility({ idleDelay: OVERLAY_IDLE_DELAY, leaveDelay: OVERLAY_LEAVE_DELAY }, scheduler);
  const fullscreen = new LightboxFullscreen(currentDocument());
  const zoom = new LightboxZoom(
    { minimumScale: ZOOM_MINIMUM_SCALE, maximumScale: ZOOM_MAXIMUM_SCALE },
    { currentItem: navigation.currentItem, mediaSize: stage.mediaSize, enabled: computed(() => !simple.value) }
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
    closesOnPress: computed(() => simple.value && stage.video.value === undefined),
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

function limitToSimpleCommands(handlers: CommandHandlers<LightboxCommand>, simple: Readable<boolean>): CommandHandlers<LightboxCommand> {
  const entries = Object.entries(handlers) as Array<[LightboxCommand, () => void]>;
  return Object.fromEntries(entries.map(([command, run]) => [
    command, (): void => {
      if (!simple.peek() || SIMPLE_COMMANDS.has(command)) {
        run();
      }
    }
  ])) as CommandHandlers<LightboxCommand>;
}
