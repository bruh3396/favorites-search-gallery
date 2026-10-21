import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { LightboxArrow } from "@/core/features/lightbox2/ui/arrow";
import { LightboxButton } from "@/core/features/lightbox2/ui/button";
import { LightboxCommands } from "@/core/features/lightbox2/commands";
import { LightboxGif } from "@/core/features/lightbox2/ui/gif";
import { LightboxImage } from "@/core/features/lightbox2/ui/image";
import { LightboxOverlay } from "@/core/features/lightbox2/ui/overlay";
import { LightboxOverlayVisibility } from "@/core/features/lightbox2/overlay_visibility";
import { LightboxPosition } from "@/core/features/lightbox2/ui/position";
import { LightboxPreview } from "@/core/features/lightbox2/ui/preview";
import { LightboxStage } from "@/core/features/lightbox2/stage";
import { LightboxVideo } from "@/core/features/lightbox2/ui/video";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { SequencePosition } from "@/core/domain/media/media_sequence";
import { h } from "@/core/ui/h/h";

export const LightboxDialogClass = {
  root: "fsg-LightboxDialog"
} as const;

export interface LightboxDialogProps<T extends MediaItem> {
  isOpen: Readable<boolean>;
  currentItem: Readable<T | undefined>;
  position: Readable<SequencePosition | undefined>;
  stage: LightboxStage<T>;
  overlayVisibility: LightboxOverlayVisibility;
  inFullscreen: Readable<boolean>;
  commands: LightboxCommands;
  onKeyDown: (event: KeyboardEvent) => void;
  resolvePreviewUrl: (media: Media) => Promise<string>;
}

export function LightboxDialog<T extends MediaItem>(props: LightboxDialogProps<T>): HTMLDialogElement {
  const { stage, overlayVisibility } = props;
  const isPreviewHidden = computed(() => props.currentItem.value?.media.kind === "video" || stage.image.value !== undefined || stage.gif.value !== undefined);
  const dialog = (
    <dialog
      className={LightboxDialogClass.root}
      aria-label="Gallery"
      tabIndex={-1}
      onClose={props.commands.close}
      onKeydown={props.onKeyDown}
      onPointermove={() => overlayVisibility.wake()}
      onPointerleave={() => overlayVisibility.leave()}
    >
      <LightboxPreview item={props.currentItem} hidden={isPreviewHidden} resolvePreviewUrl={props.resolvePreviewUrl} />
      <LightboxImage bitmap={stage.image} />
      <LightboxGif element={stage.gif} />
      <LightboxVideo element={stage.video} onClick={props.commands.togglePause} onFocusIn={() => dialog.focus({ preventScroll: true })} />
      <LightboxOverlay
        onSlotEnter={() => overlayVisibility.hold()}
        onSlotLeave={() => overlayVisibility.release()}
        topStart={<LightboxPosition position={props.position} />}
        topEnd={[
          <LightboxButton icon="download" label="Download" onClick={props.commands.download} />,
          <LightboxButton
            icon={computed(() => (props.inFullscreen.value ? "exitFullscreen" : "fullscreen"))}
            label="Fullscreen"
            pressed={props.inFullscreen}
            onClick={props.commands.toggleFullscreen}
          />,
          <LightboxButton icon="postPage" label="Open post page" onClick={props.commands.openPostPage} />,
          <LightboxButton icon="close" label="Close" onClick={props.commands.close} />
        ]}
        startEdge={<LightboxArrow direction="previous" onClick={props.commands.showPrevious} />}
        endEdge={<LightboxArrow direction="next" onClick={props.commands.showNext} />}
      />
    </dialog>
  ) as HTMLDialogElement;

  effect(() => (props.isOpen.value ? openModal(dialog, overlayVisibility) : dialog.close()));
  effect(() => dialog.toggleAttribute("data-idle", !overlayVisibility.visible.value));
  return dialog;
}

function openModal(dialog: HTMLDialogElement, overlayVisibility: LightboxOverlayVisibility): void {
  dialog.showModal();
  dialog.focus({ preventScroll: true });
  overlayVisibility.wake();
}
