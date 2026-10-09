import { Readable, effect } from "@/core/utils/reactive/signal";
// import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { LightboxStage } from "@/core/ui/lightbox/stage/stage";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SequencePosition } from "@/core/contracts/media_sequence";
import { h } from "@/core/ui/h/h";

export const LightboxScreenClass = {
  root: "fsg-LightboxScreen",
  position: "fsg-LightboxScreen-position"
} as const;

export interface LightboxScreenProps {
  current: Readable<MediaItem | undefined>;
  neighbors: Readable<readonly MediaItem[]>;
  position: Readable<SequencePosition | undefined>;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  resolveOriginalUrl: (media: Media) => Promise<string>;
  fetchOriginal: (media: Media) => Promise<Blob>;
  scheduler: Pick<Scheduler, "schedule">;
  onShowNext: () => void;
  onShowPrevious: () => void;
  onClose: () => void;
}

export function LightboxScreen(props: LightboxScreenProps): HTMLElement {
  const { current, neighbors, position, resolvePreviewUrl, resolveOriginalUrl, scheduler, onClose, fetchOriginal } = props;
  const dialog = (
    <dialog
      className={LightboxScreenClass.root}
      aria-label="Gallery"
      autofocus
      onClose={event => reportDismissal(event.currentTarget, current, onClose)}
      onKeydown={event => handleKey(event, props)}
      onClick={event => closeOnBackdrop(event, onClose)}
    >
      <LightboxStage
        current={current}
        neighbors={neighbors}
        resolvePreviewUrl={resolvePreviewUrl}
        resolveOriginalUrl={resolveOriginalUrl}
        scheduler={scheduler}
        fetchOriginal={fetchOriginal}
      />
      {/* <div className={LightboxScreenClass.position} hidden={computed(() => position.value === undefined) }>
        {computed(() => formatPosition(position.value))}
      </div> */}
    </dialog>
  ) as HTMLDialogElement;

  effect(() => setOpen(dialog, current.value !== undefined));
  return dialog;
}

function formatPosition(position: SequencePosition | undefined): string {
  if (position === undefined) {
    return "";
  }
  const shown = (position.index + 1).toLocaleString();
  return position.total === undefined ? shown : `${shown} / ${position.total.toLocaleString()}`;
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
