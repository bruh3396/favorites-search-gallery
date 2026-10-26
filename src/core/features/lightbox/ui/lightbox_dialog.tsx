import { CommandHandlers } from "@/core/ui/hotkeys/command_handlers";
import { Keymap } from "@/core/ui/hotkeys/keymap";
import { LightboxCommand } from "@/core/features/lightbox/input/lightbox_command";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { LightboxArrow } from "@/core/features/lightbox/ui/chrome/lightbox_arrow";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/lightbox_autoplay";
import { LightboxAutoplayBar } from "@/core/features/lightbox/ui/chrome/lightbox_autoplay_bar";
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
  details?: LightboxDetails<T>;
  simple: Readable<boolean>;
  closesOnPress: Readable<boolean>;
  stage: LightboxStage<T>;
  overlayVisibility: LightboxOverlayVisibility;
  inFullscreen: Readable<boolean>;
  zoom: LightboxZoom;
  autoplay: Pick<LightboxAutoplay, "isPlaying" | "countdown">;
  sizeObserver: SizeObserver;
  handlers: CommandHandlers<LightboxCommand>;
  keymap: Keymap<LightboxCommand>;
  keyListener: (event: KeyboardEvent) => void;
  mouseListeners: LightboxMouseListeners;
}

export function LightboxDialog<T extends MediaItem>(props: LightboxDialogProps<T>): HTMLDialogElement {
  const { stage, overlayVisibility, zoom, handlers, details } = props;
  const detailsShortcut = findLightboxShortcut(props.keymap, "toggleDetails");
  const detailsContent = details?.createContent(props.currentItem);
  const dialog = (
    <dialog
      className={LightboxDialogClass.root}
      aria-label="Gallery"
      tabIndex={-1}
      onClose={handlers.close}
      onKeydown={props.keyListener}
      onPointermove={() => overlayVisibility.wake()}
      onPointerleave={() => overlayVisibility.leave()}
      {...props.mouseListeners}
    >
      <LightboxViewport
        zoom={zoom}
        sizeObserver={props.sizeObserver}
        handlers={handlers}
        closesOnPress={props.closesOnPress}
        content={[
          <LightboxPreview src={stage.shownPreviewUrl} />,
          <LightboxImage element={stage.image} />,
          <LightboxGif element={stage.gif} />,
          <LightboxVideo element={stage.video} onClick={handlers.togglePause} onFocusIn={() => dialog.focus({ preventScroll: true })} />
        ]}
      />
      <LightboxOverlay
        onSlotEnter={() => overlayVisibility.hold()}
        onSlotLeave={() => overlayVisibility.release()}
        topEdge={<LightboxAutoplayBar countdown={props.autoplay.countdown} />}
        topStart={
          <LightboxPosition position={props.position} />
        }
        topEnd={
          <LightboxToolbar
            isAutoplaying={props.autoplay.isPlaying}
            inFullscreen={props.inFullscreen}
            detailsOpen={details?.isOpen}
            handlers={handlers}
            keymap={props.keymap}
          />
        }
        startEdge={<LightboxArrow direction="previous" shortcut={findLightboxShortcut(props.keymap, "showPrevious")} onClick={handlers.showPrevious} />}
        endEdge={<LightboxArrow direction="next" shortcut={findLightboxShortcut(props.keymap, "showNext")} onClick={handlers.showNext} />}
      />
      <LightboxZoomChip pixelScale={zoom.pixelScale} />
      <LightboxMinimap previewUrl={stage.previewUrl} zoom={zoom} />
      {details === undefined ? null : (
        <LightboxDetailsPanel
          isOpen={details.isOpen}
          title={detailsContent?.title}
          controls={detailsContent?.controls}
          content={detailsContent?.body}
          closeShortcut={detailsShortcut}
          onClose={handlers.toggleDetails}
          onPointerenter={() => overlayVisibility.hold()}
          onPointerleave={() => overlayVisibility.release()}
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
    overlayVisibility.wake();
  });
  effect(() => dialog.toggleAttribute("data-idle", !overlayVisibility.visible.value));
  effect(() => dialog.toggleAttribute("data-simple", props.simple.value));
  effect(() => dialog.toggleAttribute("data-details-open", !props.simple.value && (details?.isOpen.value ?? false)));
  return dialog;
}
