import { Readable, effect } from "@/core/utils/reactive/signal";
import { LightboxStage } from "@/core/ui/lightbox/stage";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { h } from "@/core/ui/h/h";

export const LightboxScreenClass = {
  root: "fsg-LightboxScreen"
} as const;

export interface LightboxScreenProps {
  current: Readable<MediaItem | undefined>;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  resolveOriginalUrl: (media: Media) => Promise<string>;
  onShowNext: () => void;
  onShowPrevious: () => void;
  onClose: () => void;
}

export function LightboxScreen(props: LightboxScreenProps): HTMLElement {
  const { current, resolvePreviewUrl, resolveOriginalUrl, onClose } = props;
  const dialog = (
    <dialog
      className={LightboxScreenClass.root}
      aria-label="Gallery"
      autofocus
      onClose={event => reportDismissal(event.currentTarget, current, onClose)}
      onKeydown={event => handleKey(event, props)}
      onClick={event => closeOnBackdrop(event, onClose)}
    >
      <LightboxStage current={current} resolvePreviewUrl={resolvePreviewUrl} resolveOriginalUrl={resolveOriginalUrl} />
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
