import { Readable, effect } from "@/core/utils/reactive/signal";
import { LightboxStage } from "@/core/ui/lightbox/stage";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { h } from "@/core/ui/h/h";
import { selectSharpnessMode } from "@/core/ui/lightbox/sharpness_experiment";

export const LightboxScreenClass = {
  root: "fsg-LightboxScreen"
} as const;

export interface LightboxScreenProps {
  current: Readable<MediaItem | undefined>;
  neighbors: Readable<readonly MediaItem[]>;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  resolveOriginalUrl: (media: Media) => Promise<string>;
  // TODO: temporary, for the sharpness experiment.
  fetchOriginal?: (media: Media) => Promise<Blob>;
  onShowNext: () => void;
  onShowPrevious: () => void;
  onClose: () => void;
}

export function LightboxScreen(props: LightboxScreenProps): HTMLElement {
  const { current, neighbors, resolvePreviewUrl, resolveOriginalUrl, fetchOriginal, onClose } = props;
  const dialog = (
    <dialog
      className={LightboxScreenClass.root}
      aria-label="Gallery"
      autofocus
      onClose={event => reportDismissal(event.currentTarget, current, onClose)}
      onKeydown={event => handleKey(event, props)}
      onClick={event => closeOnBackdrop(event, onClose)}
    >
      <LightboxStage current={current} neighbors={neighbors} resolvePreviewUrl={resolvePreviewUrl} resolveOriginalUrl={resolveOriginalUrl} fetchOriginal={fetchOriginal} />
    </dialog>
  ) as HTMLDialogElement;

  effect(() => setOpen(dialog, current.value !== undefined));
  return dialog;
}

function setOpen(dialog: HTMLDialogElement, open: boolean): void {
  if (!open) {
    dialog.close();
  } else if (!dialog.open) {
    dialog.showModal();
  }
}

function handleKey(event: KeyboardEvent, { onShowNext, onShowPrevious }: LightboxScreenProps): void {
  const action = { ArrowRight: onShowNext, ArrowLeft: onShowPrevious }[event.key];

  if (action !== undefined) {
    event.preventDefault();
    action();
  }
  // TODO: temporary, for the sharpness experiment.
  selectSharpnessMode(event.key);
}

function closeOnBackdrop(event: MouseEvent, onClose: () => void): void {
  if (event.target === event.currentTarget) {
    onClose();
  }
}

function reportDismissal(dialog: HTMLDialogElement, current: Readable<MediaItem | undefined>, onClose: () => void): void {
  if (!dialog.open && current.peek() !== undefined) {
    onClose();
  }
}
