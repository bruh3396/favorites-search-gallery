import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { currentDocument, h } from "@/core/ui/h/h";
import { CommandHandlers } from "@/core/ui/hotkeys/command_handlers";
import { Keymap } from "@/core/ui/hotkeys/keymap";
import { LightboxActions } from "@/core/features/lightbox/lightbox_actions";
import { LightboxArrow } from "@/core/features/lightbox/navigation/lightbox_arrow";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/lightbox_autoplay";
import { LightboxAutoplayBar } from "@/core/features/lightbox/autoplay/lightbox_autoplay_bar";
import { LightboxButton } from "@/core/features/lightbox/overlay/lightbox_button";
import { LightboxCloser } from "@/core/features/lightbox/close_morph/lightbox_closer";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { LightboxDetails } from "@/core/features/lightbox/details/lightbox_details";
import { LightboxDetailsPanel } from "@/core/features/lightbox/details/lightbox_details_panel";
import { LightboxDialog } from "@/core/features/lightbox/lightbox_dialog";
import { LightboxFavorite } from "@/core/features/lightbox/favorite/lightbox_favorite";
import { LightboxFrame } from "@/core/features/lightbox/lightbox_frame";
import { LightboxFullscreen } from "@/core/features/lightbox/lightbox_fullscreen";
import { LightboxGif } from "@/core/features/lightbox/media/lightbox_gif";
import { LightboxImage } from "@/core/features/lightbox/media/lightbox_image";
import { LightboxMediaResolver } from "@/core/features/lightbox/media/lightbox_media_resolver";
import { LightboxMinimap } from "@/core/features/lightbox/zoom/lightbox_minimap";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/lightbox_navigation";
import { LightboxOverlay } from "@/core/features/lightbox/overlay/lightbox_overlay";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/overlay/lightbox_overlay_visibility";
import { LightboxPosition } from "@/core/features/lightbox/navigation/lightbox_position";
import { LightboxPreferences } from "@/core/features/lightbox/lightbox_preferences";
import { LightboxPreview } from "@/core/features/lightbox/media/lightbox_preview";
import { LightboxStage } from "@/core/features/lightbox/media/lightbox_stage";
import { LightboxToolbar } from "@/core/features/lightbox/overlay/lightbox_toolbar";
import { LightboxVideo } from "@/core/features/lightbox/media/lightbox_video";
import { LightboxViewport } from "@/core/features/lightbox/zoom/lightbox_viewport";
import { LightboxZoom } from "@/core/features/lightbox/zoom/lightbox_zoom";
import { LightboxZoomChip } from "@/core/features/lightbox/zoom/lightbox_zoom_chip";
import { MediaItem } from "@/core/domain/media/media_item";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { Viewport } from "@/core/boundary/ports/viewport/viewport";
import { createLightboxCommandHandlers } from "@/core/features/lightbox/commands/lightbox_command_handlers";
import { createLightboxKeyListener } from "@/core/features/lightbox/commands/lightbox_key_listener";
import { createLightboxMouseListeners } from "@/core/features/lightbox/commands/lightbox_mouse_listeners";
import { findLightboxShortcut } from "@/core/features/lightbox/commands/lightbox_shortcut_finder";

const GIF_CAPACITY = 3;
const VIDEO_CAPACITY = 5;
const OVERLAY_IDLE_DELAY = 750;
const OVERLAY_LEAVE_DELAY = 1_000;
const ZOOM_MINIMUM_SCALE = 2;
const ZOOM_MAXIMUM_SCALE = 8;
const AUTOPLAY_INTERVAL = 3_000;
const FULL_MORPH_DURATION = 250;
const SIMPLE_MORPH_DURATION = 200;
const SIMPLE_COMMANDS: ReadonlySet<LightboxCommand> = new Set<LightboxCommand>([
  "showNext",
  "showPrevious",
  "togglePause",
  "toggleMute",
  "toggleFullscreen",
  "dismiss",
  "close",
  "openPostPage",
  "openOriginal",
  "addFavorite"
]);

export interface LightboxDialogConfiguration {
  readonly keymap: Keymap<LightboxCommand>;
}

export interface LightboxDialogDependencies<T extends MediaItem> {
  scheduler: Pick<Scheduler, "schedule" | "requestFrame">;
  sizeObserver: SizeObserver;
  viewport: Pick<Viewport, "readDevicePixelRatio">;
  remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl" | "resolveOriginalUrl" | "decodeStill" | "loadOriginal">;
  lightboxMediaResolver: LightboxMediaResolver;
  lightboxActions: LightboxActions;
  lightboxNavigation: Pick<LightboxNavigation<T>, "isOpen" | "currentItem" | "position" | "goToNext" | "goToPrevious" | "close">;
  retainedItems: Readable<readonly T[]>;
  lightboxPreferences: LightboxPreferences;
  locateItem: (item: T) => Element | undefined;
  lightboxDetails?: LightboxDetails<T>;
  lightboxFavorite?: LightboxFavorite<T>;
}

export function composeLightboxDialog<T extends MediaItem>(
  configuration: LightboxDialogConfiguration,
  dependencies: LightboxDialogDependencies<T>
): HTMLElement {
  const {
    scheduler, sizeObserver, viewport, remoteMedia, lightboxMediaResolver, lightboxActions, lightboxNavigation,
    retainedItems, lightboxPreferences, locateItem, lightboxDetails, lightboxFavorite
  } = dependencies;
  const { mode, volume, muted } = lightboxPreferences;
  const simple = computed(() => mode.value === "simple");
  const lightboxStage = new LightboxStage<T>(
    { gifCapacity: GIF_CAPACITY, videoCapacity: VIDEO_CAPACITY },
    { remoteMedia, lightboxMediaResolver, currentItem: lightboxNavigation.currentItem, retainedItems, volume, muted }
  );
  const lightboxOverlayVisibility = new LightboxOverlayVisibility({ idleDelay: OVERLAY_IDLE_DELAY, leaveDelay: OVERLAY_LEAVE_DELAY }, scheduler);
  let frame: HTMLElement | undefined;
  const lightboxFullscreen = new LightboxFullscreen({
    ownerDocument: currentDocument(),
    requestFullscreen: (): Promise<void> => frame!.requestFullscreen()
  });
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
    scheduler,
    viewport,
    lightboxNavigation,
    shownMedia: lightboxStage.shownMedia,
    canMorph: computed(() => !lightboxFullscreen.inFullscreen.value),
    morphDuration: computed(() => (simple.value ? SIMPLE_MORPH_DURATION : FULL_MORPH_DURATION)),
    locateItem
  });
  const handlers = limitToSimpleCommands(
    createLightboxCommandHandlers({
      lightboxNavigation, lightboxStage, lightboxFullscreen, lightboxZoom, lightboxAutoplay, lightboxCloser, lightboxActions, lightboxDetails, lightboxFavorite
    }),
    simple
  );

  effect(() => {
    if (!lightboxNavigation.isOpen.value) {
      lightboxFullscreen.exit();
    }
  });
  const { keymap } = configuration;
  const lightboxDetailsContent = lightboxDetails?.createContent(lightboxNavigation.currentItem);
  const isFavorited = computed(() => {
    const currentItem = lightboxNavigation.currentItem.value;
    return currentItem !== undefined && lightboxFavorite?.isFavorited(currentItem) === true;
  });
  return h(LightboxDialog, {
    isOpen: lightboxNavigation.isOpen,
    simple,
    detailsOpen: lightboxDetails?.isOpen,
    lightboxOverlayVisibility,
    handlers,
    onKeydown: createLightboxKeyListener(keymap, handlers),
    lightboxMouseListeners: createLightboxMouseListeners(handlers),
    renderFrame: onMediaFocus => (frame = h(LightboxFrame, {
      contentChild: [
      h(LightboxViewport, {
        zoom: lightboxZoom,
        sizeObserver,
        handlers,
        closesOnPress: computed(() => simple.value && lightboxStage.video.value === undefined),
        contentChild: [
          h(LightboxPreview, { src: lightboxStage.shownPreviewUrl }),
          h(LightboxImage, { element: lightboxStage.image }),
          h(LightboxGif, { element: lightboxStage.gif }),
          h(LightboxVideo, { element: lightboxStage.video, onClick: handlers.togglePause, onFocusIn: onMediaFocus })
        ]
      }),
      h(LightboxOverlay, {
        onSlotEnter: () => lightboxOverlayVisibility.hold(),
        onSlotLeave: () => lightboxOverlayVisibility.release(),
        topEdgeChild: h(LightboxAutoplayBar, { countdown: lightboxAutoplay.countdown }),
        topStartChild: h(LightboxPosition, { position: lightboxNavigation.position }),
        topEndChild: h(LightboxToolbar, {
          isAutoplaying: lightboxAutoplay.isPlaying,
          inFullscreen: lightboxFullscreen.inFullscreen,
          detailsOpen: lightboxDetails?.isOpen,
          leadingChild: lightboxFavorite === undefined ? undefined : h(LightboxButton, {
            icon: computed(() => (isFavorited.value ? "heartFilled" : "heartPlus")),
            label: computed(() => (isFavorited.value ? "Favorited" : "Add to Favorites")),
            lightboxShortcut: findLightboxShortcut(keymap, "addFavorite"),
            onClick: handlers.addFavorite
          }),
          handlers,
          keymap
        }),
        startEdgeChild: h(LightboxArrow, {
          direction: "previous", lightboxShortcut: findLightboxShortcut(keymap, "showPrevious"), onClick: handlers.showPrevious
        }),
        endEdgeChild: h(LightboxArrow, { direction: "next", lightboxShortcut: findLightboxShortcut(keymap, "showNext"), onClick: handlers.showNext })
      }),
      h(LightboxZoomChip, { pixelScale: lightboxZoom.pixelScale }),
      h(LightboxMinimap, { previewUrl: lightboxStage.previewUrl, lightboxZoom }),
      lightboxDetails === undefined || lightboxDetailsContent === undefined ? undefined : h(LightboxDetailsPanel, {
        isOpen: lightboxDetails.isOpen,
        titleChild: lightboxDetailsContent.titleChild,
        controlsChild: lightboxDetailsContent.controlsChild,
        contentChild: lightboxDetailsContent.bodyChild,
        closeLightboxShortcut: findLightboxShortcut(keymap, "toggleDetails"),
        onClose: handlers.toggleDetails,
        onPointerenter: () => lightboxOverlayVisibility.hold(),
        onPointerleave: () => lightboxOverlayVisibility.release()
      })
      ]
    }))
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
