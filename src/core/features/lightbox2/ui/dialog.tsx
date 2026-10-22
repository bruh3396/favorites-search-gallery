import { Readable, effect } from "@/core/utils/reactive/signal";
import { LightboxArrow } from "@/core/features/lightbox2/ui/arrow";
import { LightboxAutoplay } from "@/core/features/lightbox2/autoplay";
import { LightboxAutoplayBar } from "@/core/features/lightbox2/ui/autoplay_bar";
import { LightboxCommandHandlers } from "@/core/features/lightbox2/commands";
import { LightboxGif } from "@/core/features/lightbox2/ui/gif";
import { LightboxImage } from "@/core/features/lightbox2/ui/image";
import { LightboxMinimap } from "@/core/features/lightbox2/ui/minimap";
import { LightboxMouseListeners } from "@/core/features/lightbox2/mouse_listeners";
import { LightboxOverlay } from "@/core/features/lightbox2/ui/overlay";
import { LightboxOverlayVisibility } from "@/core/features/lightbox2/overlay_visibility";
import { LightboxPosition } from "@/core/features/lightbox2/ui/position";
import { LightboxPreview } from "@/core/features/lightbox2/ui/preview";
import { LightboxStage } from "@/core/features/lightbox2/stage";
import { LightboxToolbar } from "@/core/features/lightbox2/ui/toolbar";
import { LightboxVideo } from "@/core/features/lightbox2/ui/video";
import { LightboxViewport } from "@/core/features/lightbox2/ui/viewport";
import { LightboxZoom } from "@/core/features/lightbox2/zoom";
import { LightboxZoomChip } from "@/core/features/lightbox2/ui/zoom_chip";
import { MediaItem } from "@/core/domain/post/post";
import { SequencePosition } from "@/core/domain/media/media_sequence";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { h } from "@/core/ui/h/h";

export const LightboxDialogClass = {
  root: "fsg-LightboxDialog"
} as const;

export interface LightboxDialogProps<T extends MediaItem> {
  isOpen: Readable<boolean>;
  position: Readable<SequencePosition | undefined>;
  stage: LightboxStage<T>;
  overlayVisibility: LightboxOverlayVisibility;
  inFullscreen: Readable<boolean>;
  zoom: LightboxZoom;
  autoplay: Pick<LightboxAutoplay, "isPlaying" | "countdown">;
  sizeObserver: SizeObserver;
  handlers: LightboxCommandHandlers;
  keyListener: (event: KeyboardEvent) => void;
  mouseListeners: LightboxMouseListeners;
}

export function LightboxDialog<T extends MediaItem>(props: LightboxDialogProps<T>): HTMLDialogElement {
  const { stage, overlayVisibility, zoom, handlers } = props;
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
        topStart={<LightboxPosition position={props.position} />}
        topEnd={<LightboxToolbar zoom={zoom} isAutoplaying={props.autoplay.isPlaying} inFullscreen={props.inFullscreen} handlers={handlers} />}
        startEdge={<LightboxArrow direction="previous" onClick={handlers.showPrevious} />}
        endEdge={<LightboxArrow direction="next" onClick={handlers.showNext} />}
      />
      <LightboxZoomChip pixelScale={zoom.pixelScale} />
      <LightboxMinimap previewUrl={stage.previewUrl} zoom={zoom} />
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
  return dialog;
}
