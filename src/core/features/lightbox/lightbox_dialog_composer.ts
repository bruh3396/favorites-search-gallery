import { LIGHTBOX_COMMAND_DEFINITIONS, LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { LightboxOverlayDependencies, composeLightboxOverlay } from "@/core/features/lightbox/overlay/lightbox_overlay_composer";
import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { currentDocument, h } from "@/core/ui/h/h";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { LightboxActions } from "@/core/features/lightbox/lightbox_actions";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/lightbox_autoplay";
import { LightboxButton } from "@/core/features/lightbox/overlay/lightbox_button";
import { LightboxCloser } from "@/core/features/lightbox/close_morph/lightbox_closer";
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
import { LightboxOverlayVisibility } from "@/core/features/lightbox/overlay/lightbox_overlay_visibility";
import { LightboxPreferences } from "@/core/features/lightbox/lightbox_preferences";
import { LightboxPreview } from "@/core/features/lightbox/media/lightbox_preview";
import { LightboxStage } from "@/core/features/lightbox/media/lightbox_stage";
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
import { createLightboxMouseListeners } from "@/core/features/lightbox/commands/lightbox_mouse_listeners";
import { formatLightboxCommandTitle } from "@/core/features/lightbox/commands/lightbox_command_title_formatter";
import { limitLightboxCommandHandlers } from "@/core/features/lightbox/commands/lightbox_command_handlers_limiter";
import { listenForKeyBindings } from "@/core/ui/key_bindings/key_bindings_listener";
import { onCleanup } from "@/core/utils/reactive/scope";

const GIF_CAPACITY = 3;
const VIDEO_CAPACITY = 5;
const OVERLAY_IDLE_DELAY = 750;
const OVERLAY_LEAVE_DELAY = 1_000;
const ZOOM_MINIMUM_SCALE = 2;
const ZOOM_MAXIMUM_SCALE = 8;
const AUTOPLAY_INTERVAL = 3_000;
const MORPH_DURATION = 250;

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
  lightboxKeyBindings: Readable<KeyBindings<LightboxCommand>>;
  locateItem: (item: T) => Element | undefined;
  lightboxDetails?: LightboxDetails<T>;
  lightboxFavorite?: LightboxFavorite<T>;
}

export function composeLightboxDialog<T extends MediaItem>(dependencies: LightboxDialogDependencies<T>): HTMLElement {
  const { scheduler, sizeObserver, viewport, remoteMedia, lightboxMediaResolver, lightboxActions, lightboxNavigation, retainedItems } = dependencies;
  const { lightboxPreferences, lightboxKeyBindings, locateItem, lightboxDetails, lightboxFavorite } = dependencies;
  const { mode, volume, muted } = lightboxPreferences;
  const simple = computed(() => mode.value === "simple");
  const lightboxStage = new LightboxStage<T>(
    { gifCapacity: GIF_CAPACITY, videoCapacity: VIDEO_CAPACITY },
    { remoteMedia, lightboxMediaResolver, currentItem: lightboxNavigation.currentItem, retainedItems, volume, muted }
  );
  const lightboxOverlayVisibility = new LightboxOverlayVisibility({ idleDelay: OVERLAY_IDLE_DELAY, leaveDelay: OVERLAY_LEAVE_DELAY }, scheduler);
  let frame: HTMLElement | undefined;
  const lightboxFullscreen = new LightboxFullscreen({ ownerDocument: currentDocument(), requestFullscreen: (): Promise<void> => frame!.requestFullscreen() });
  const lightboxZoom = new LightboxZoom(
    { minimumScale: ZOOM_MINIMUM_SCALE, maximumScale: ZOOM_MAXIMUM_SCALE },
    { currentItem: lightboxNavigation.currentItem, mediaSize: lightboxStage.mediaSize, enabled: computed(() => !simple.value) }
  );
  const isMoreMenuOpen = new Signal(false);
  const lightboxAutoplay = new LightboxAutoplay({ interval: AUTOPLAY_INTERVAL }, {
    scheduler, lightboxNavigation, video: lightboxStage.video,
    canCountDown: computed(() => lightboxStage.mediaSize.value !== undefined && !lightboxZoom.isZoomed.value && !isMoreMenuOpen.value)
  });
  const lightboxCloser = new LightboxCloser<T>({
    scheduler, viewport, lightboxNavigation, shownMedia: lightboxStage.shownMedia, morphDuration: computed(() => MORPH_DURATION), locateItem,
    canMorph: computed(() => !simple.value && !lightboxFullscreen.inFullscreen.value)
  });
  const handlers = limitLightboxCommandHandlers(createLightboxCommandHandlers({
    lightboxNavigation, lightboxStage, lightboxFullscreen, lightboxZoom, lightboxAutoplay, lightboxCloser, lightboxActions, lightboxDetails, lightboxFavorite
  }), simple);
  const createLightboxCommandButton: LightboxOverlayDependencies<T>["createLightboxCommandButton"] = (lightboxCommand, {
    icon, label = LIGHTBOX_COMMAND_DEFINITIONS[lightboxCommand].label, pressed
  }) => h(LightboxButton, {
    icon, label, pressed, onClick: handlers[lightboxCommand],
    title: computed(() => formatLightboxCommandTitle(lightboxCommand, lightboxKeyBindings.value, typeof label === "string" ? label : label.value))
  });

  effect(() => {
    if (!lightboxNavigation.isOpen.value) {
      lightboxFullscreen.exit();
    }
  });
  const lightboxDetailsContent = lightboxDetails?.createContent(lightboxNavigation.currentItem);
  const lightboxDialog = h(LightboxDialog, {
    isOpen: lightboxNavigation.isOpen, simple, detailsOpen: lightboxDetails?.isOpen, lightboxOverlayVisibility, handlers,
    lightboxMouseListeners: createLightboxMouseListeners(handlers),
    renderFrame: onMediaFocus => (frame = h(LightboxFrame, {
      contentChild: [
        h(LightboxViewport, {
          zoom: lightboxZoom, sizeObserver, handlers, closesOnPress: computed(() => simple.value && lightboxStage.video.value === undefined),
          contentChild: [
            h(LightboxPreview, { src: lightboxStage.shownPreviewUrl }),
            h(LightboxImage, { element: lightboxStage.image }),
            h(LightboxGif, { element: lightboxStage.gif }),
            h(LightboxVideo, { element: lightboxStage.video, onClick: handlers.togglePause, onFocusIn: onMediaFocus })
          ]
        }),
        composeLightboxOverlay({
          visibility: lightboxOverlayVisibility, lightboxNavigation, lightboxStage, lightboxZoom, lightboxAutoplay, lightboxFullscreen, muted,
          lightboxKeyBindings, handlers, createLightboxCommandButton, lightboxDetails, lightboxFavorite,
          onMoreMenuOpenChange: isOpen => (isMoreMenuOpen.value = isOpen)
        }),
        h(LightboxZoomChip, { pixelScale: lightboxZoom.pixelScale }),
        h(LightboxMinimap, { previewUrl: lightboxStage.previewUrl, lightboxZoom }),
        lightboxDetails === undefined || lightboxDetailsContent === undefined ? undefined : h(LightboxDetailsPanel, {
          isOpen: lightboxDetails.isOpen, titleChild: lightboxDetailsContent.titleChild, controlsChild: lightboxDetailsContent.controlsChild,
          trailingChild: createLightboxCommandButton("toggleDetails", { icon: "closeLarge", label: "Hide Details" }),
          contentChild: lightboxDetailsContent.bodyChild,
          onPointerenter: () => lightboxOverlayVisibility.hold(), onPointerleave: () => lightboxOverlayVisibility.release()
        })
      ]
    }))
  });

  onCleanup(listenForKeyBindings(
    { keyBindings: lightboxKeyBindings, commandDefinitionByCommand: LIGHTBOX_COMMAND_DEFINITIONS },
    { target: lightboxDialog, handlers }
  ));
  return lightboxDialog;
}
