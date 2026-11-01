import { Readable, effect } from "@/core/utils/reactive/signal";
import { CommandHandlers } from "@/core/ui/hotkeys/command_handlers";
import { Keymap } from "@/core/ui/hotkeys/keymap";
import { LightboxArrow } from "@/core/features/lightbox/ui/chrome/lightbox_arrow";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/lightbox_autoplay";
import { LightboxAutoplayBar } from "@/core/features/lightbox/ui/chrome/lightbox_autoplay_bar";
import { LightboxCommand } from "@/core/features/lightbox/input/lightbox_command";
import { LightboxDetails } from "@/core/features/lightbox/details/lightbox_details";
import { LightboxDetailsPanel } from "@/core/features/lightbox/ui/details/lightbox_details_panel";
import { LightboxGif } from "@/core/features/lightbox/ui/media/lightbox_gif";
import { LightboxImage } from "@/core/features/lightbox/ui/media/lightbox_image";
import { LightboxMinimap } from "@/core/features/lightbox/ui/chrome/lightbox_minimap";
import { LightboxMouseListeners } from "@/core/features/lightbox/input/lightbox_mouse_listeners";
import { LightboxOverlay } from "@/core/features/lightbox/ui/chrome/lightbox_overlay";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/overlay_visibility/lightbox_overlay_visibility";
import { LightboxPosition } from "@/core/features/lightbox/ui/chrome/lightbox_position";
import { LightboxPreview } from "@/core/features/lightbox/ui/media/lightbox_preview";
import { LightboxStage } from "@/core/features/lightbox/stage/lightbox_stage";
import { LightboxToolbar } from "@/core/features/lightbox/ui/chrome/lightbox_toolbar";
import { LightboxVideo } from "@/core/features/lightbox/ui/media/lightbox_video";
import { LightboxViewport } from "@/core/features/lightbox/ui/media/lightbox_viewport";
import { LightboxZoom } from "@/core/features/lightbox/zoom/lightbox_zoom";
import { LightboxZoomChip } from "@/core/features/lightbox/ui/chrome/lightbox_zoom_chip";
import { MediaItem } from "@/core/domain/media/media_item";
import { MediaSequencePosition } from "@/core/domain/media/media_sequence";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { findLightboxShortcut } from "@/core/features/lightbox/input/lightbox_shortcut_finder";
import { h } from "@/core/ui/h/h";

export const LightboxDialogClass = {
  root: "fsg-LightboxDialog"
} as const;

export interface LightboxDialogProps<T extends MediaItem> {
  isOpen: Readable<boolean>;
  position: Readable<MediaSequencePosition | undefined>;
  currentItem: Readable<T | undefined>;
  lightboxDetails?: LightboxDetails<T>;
  simple: Readable<boolean>;
  closesOnPress: Readable<boolean>;
  lightboxStage: LightboxStage<T>;
  lightboxOverlayVisibility: LightboxOverlayVisibility;
  inFullscreen: Readable<boolean>;
  lightboxZoom: LightboxZoom;
  lightboxAutoplay: Pick<LightboxAutoplay, "isPlaying" | "countdown">;
  sizeObserver: SizeObserver;
  handlers: CommandHandlers<LightboxCommand>;
  keymap: Keymap<LightboxCommand>;
  onKeydown: (event: KeyboardEvent) => void;
  lightboxMouseListeners: LightboxMouseListeners;
}

export function LightboxDialog<T extends MediaItem>(props: LightboxDialogProps<T>): HTMLDialogElement {
  const { lightboxStage, lightboxOverlayVisibility, lightboxZoom, handlers, lightboxDetails } = props;
  const detailsLightboxShortcut = findLightboxShortcut(props.keymap, "toggleDetails");
  const lightboxDetailsContent = lightboxDetails?.createContent(props.currentItem);
  const dialog = (
    <dialog
      className={LightboxDialogClass.root}
      aria-label="Gallery"
      tabIndex={-1}
      onClose={handlers.close}
      onKeydown={props.onKeydown}
      onPointermove={() => lightboxOverlayVisibility.wake()}
      onPointerleave={() => lightboxOverlayVisibility.leave()}
      {...props.lightboxMouseListeners}
    >
      <LightboxViewport
        zoom={lightboxZoom}
        sizeObserver={props.sizeObserver}
        handlers={handlers}
        closesOnPress={props.closesOnPress}
        contentChild={[
          <LightboxPreview src={lightboxStage.shownPreviewUrl} />,
          <LightboxImage element={lightboxStage.image} />,
          <LightboxGif element={lightboxStage.gif} />,
          <LightboxVideo element={lightboxStage.video} onClick={handlers.togglePause} onFocusIn={() => dialog.focus({ preventScroll: true })} />
        ]}
      />
      <LightboxOverlay
        onSlotEnter={() => lightboxOverlayVisibility.hold()}
        onSlotLeave={() => lightboxOverlayVisibility.release()}
        topEdgeChild={<LightboxAutoplayBar countdown={props.lightboxAutoplay.countdown} />}
        topStartChild={
          <LightboxPosition position={props.position} />
        }
        topEndChild={
          <LightboxToolbar
            isAutoplaying={props.lightboxAutoplay.isPlaying}
            inFullscreen={props.inFullscreen}
            detailsOpen={lightboxDetails?.isOpen}
            handlers={handlers}
            keymap={props.keymap}
          />
        }
        startEdgeChild={
          <LightboxArrow
            direction="previous"
            lightboxShortcut={findLightboxShortcut(props.keymap, "showPrevious")}
            onClick={handlers.showPrevious}
          />
        }
        endEdgeChild={<LightboxArrow direction="next" lightboxShortcut={findLightboxShortcut(props.keymap, "showNext")} onClick={handlers.showNext} />}
      />
      <LightboxZoomChip pixelScale={lightboxZoom.pixelScale} />
      <LightboxMinimap previewUrl={lightboxStage.previewUrl} lightboxZoom={lightboxZoom} />
      {lightboxDetails === undefined ? null : (
        <LightboxDetailsPanel
          isOpen={lightboxDetails.isOpen}
          titleChild={lightboxDetailsContent?.titleChild}
          controlsChild={lightboxDetailsContent?.controlsChild}
          contentChild={lightboxDetailsContent?.bodyChild}
          closeLightboxShortcut={detailsLightboxShortcut}
          onClose={handlers.toggleDetails}
          onPointerenter={() => lightboxOverlayVisibility.hold()}
          onPointerleave={() => lightboxOverlayVisibility.release()}
        />
      )}
    </dialog>
  ) as HTMLDialogElement;

  effect(() => {
    if (!props.isOpen.value) {
      dialog.close();
      return;
    }
    dialog.showModal();
    dialog.focus({ preventScroll: true });
    lightboxOverlayVisibility.wake();
  });
  effect(() => dialog.toggleAttribute("data-idle", !lightboxOverlayVisibility.visible.value));
  effect(() => dialog.toggleAttribute("data-simple", props.simple.value));
  effect(() => dialog.toggleAttribute("data-details-open", !props.simple.value && (lightboxDetails?.isOpen.value ?? false)));
  return dialog;
}
