import { Readable, effect } from "@/core/utils/reactive/signal";
import { LightboxArrow } from "@/core/features/lightbox/ui/chrome/arrow";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/autoplay";
import { LightboxAutoplayBar } from "@/core/features/lightbox/ui/chrome/autoplay_bar";
import { LightboxCommandHandlers } from "@/core/features/lightbox/input/commands";
import { LightboxDetails } from "@/core/features/lightbox/details/details";
import { LightboxDetailsPanel } from "@/core/features/lightbox/ui/details/details_panel";
import { LightboxGif } from "@/core/features/lightbox/ui/media/gif";
import { LightboxImage } from "@/core/features/lightbox/ui/media/image";
import { LightboxKeymap } from "@/core/features/lightbox/input/key_listener";
import { LightboxMinimap } from "@/core/features/lightbox/ui/chrome/minimap";
import { LightboxMouseListeners } from "@/core/features/lightbox/input/mouse_listeners";
import { LightboxOverlay } from "@/core/features/lightbox/ui/chrome/overlay";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/overlay_visibility/overlay_visibility";
import { LightboxPosition } from "@/core/features/lightbox/ui/chrome/position";
import { LightboxPreview } from "@/core/features/lightbox/ui/media/preview";
import { LightboxStage } from "@/core/features/lightbox/stage/stage";
import { LightboxToolbar } from "@/core/features/lightbox/ui/chrome/toolbar";
import { LightboxVideo } from "@/core/features/lightbox/ui/media/video";
import { LightboxViewport } from "@/core/features/lightbox/ui/media/viewport";
import { LightboxZoom } from "@/core/features/lightbox/zoom/zoom";
import { LightboxZoomChip } from "@/core/features/lightbox/ui/chrome/zoom_chip";
import { MediaItem } from "@/core/domain/post/post";
import { SequencePosition } from "@/core/domain/media/media_sequence";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { findLightboxShortcut } from "@/core/features/lightbox/input/shortcut";
import { h } from "@/core/ui/h/h";

export const LightboxDialogClass = {
  root: "fsg-LightboxDialog"
} as const;

export interface LightboxDialogProps<T extends MediaItem> {
  isOpen: Readable<boolean>;
  position: Readable<SequencePosition | undefined>;
  currentItem: Readable<T | undefined>;
  details?: LightboxDetails<T>;
  stage: LightboxStage<T>;
  overlayVisibility: LightboxOverlayVisibility;
  inFullscreen: Readable<boolean>;
  zoom: LightboxZoom;
  autoplay: Pick<LightboxAutoplay, "isPlaying" | "countdown">;
  sizeObserver: SizeObserver;
  handlers: LightboxCommandHandlers;
  keymap: LightboxKeymap;
  keyListener: (event: KeyboardEvent) => void;
  mouseListeners: LightboxMouseListeners;
}

export function LightboxDialog<T extends MediaItem>(props: LightboxDialogProps<T>): HTMLDialogElement {
  const { stage, overlayVisibility, zoom, handlers, details } = props;
  const detailsShortcut = findLightboxShortcut(props.keymap, "toggleDetails");
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
          <LightboxPosition
            position={props.position}
            toggle={details === undefined ? undefined : { isOn: details.isOpen, label: "Details", shortcut: detailsShortcut, onClick: handlers.toggleDetails }}
          />
        }
        topEnd={
          <LightboxToolbar zoom={zoom} isAutoplaying={props.autoplay.isPlaying} inFullscreen={props.inFullscreen} handlers={handlers} keymap={props.keymap} />
        }
        startEdge={<LightboxArrow direction="previous" shortcut={findLightboxShortcut(props.keymap, "showPrevious")} onClick={handlers.showPrevious} />}
        endEdge={<LightboxArrow direction="next" shortcut={findLightboxShortcut(props.keymap, "showNext")} onClick={handlers.showNext} />}
      />
      <LightboxZoomChip pixelScale={zoom.pixelScale} />
      <LightboxMinimap previewUrl={stage.previewUrl} zoom={zoom} />
      {details === undefined ? null : (
        <LightboxDetailsPanel
          isOpen={details.isOpen}
          content={details.createContent(props.currentItem)}
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
  effect(() => dialog.toggleAttribute("data-details-open", details?.isOpen.value ?? false));
  return dialog;
}
