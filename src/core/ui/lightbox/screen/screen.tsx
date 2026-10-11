import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { Lightbox } from "@/core/ui/lightbox/lightbox";
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

export interface LightboxScreenProps<T extends MediaItem> {
  readonly lightbox: Lightbox<T>;
  readonly resolvePreviewUrl: (media: Media) => Promise<string>;
  readonly resolveOriginalUrl: (media: Media) => Promise<string>;
  readonly resolveOriginalImageFallbackUrl: (media: Media) => Promise<string>;
  readonly fetchOriginal: (media: Media, signal: AbortSignal) => Promise<Blob>;
  readonly bitmapDecoder: BitmapDecoder;
  readonly scheduler: Pick<Scheduler, "schedule">;
}

export function LightboxScreen<T extends MediaItem>(props: LightboxScreenProps<T>): HTMLElement {
  const { lightbox, resolvePreviewUrl, resolveOriginalUrl, resolveOriginalImageFallbackUrl, scheduler, fetchOriginal, bitmapDecoder } = props;
  const { current, neighbors, position } = lightbox;
  const onShowNext = (): void => {
    lightbox.showNext().catch(console.error);
  };
  const onShowPrevious = (): void => {
    lightbox.showPrevious().catch(console.error);
  };
  const onClose = (): void => lightbox.close();
  const dialog = (
    <dialog
      className={LightboxScreenClass.root}
      aria-label="Gallery"
      autofocus
      tabIndex={-1}
      onClose={event => reportDismissal(event.currentTarget, current, onClose)}
      onKeydown={event => handleKey(event, { dialog: event.currentTarget, onShowNext, onShowPrevious, onClose })}
      onWheel={event => handleWheel(event, onShowNext, onShowPrevious)}
      onClick={event => handleClick(event, onClose)}
      onContextmenu={event => {
        event.preventDefault();
        onClose();
      }}
    >
      <LightboxStage
        current={current}
        neighbors={neighbors}
        resolvePreviewUrl={resolvePreviewUrl}
        resolveOriginalUrl={resolveOriginalUrl}
        resolveOriginalImageFallbackUrl={resolveOriginalImageFallbackUrl}
        scheduler={scheduler}
        fetchOriginal={fetchOriginal}
        bitmapDecoder={bitmapDecoder}
      />
      <div className={LightboxScreenClass.position} hidden={computed(() => position.value === undefined)}>
        {computed(() => formatPosition(position.value))}
      </div>
    </dialog>
  ) as HTMLDialogElement;

  effect(() => {
    const isClosed = current.value === undefined;

    if (isClosed) {
      dialog.close();
    } else if (!dialog.open) {
      dialog.showModal();
    }
  });
  return dialog;
}

function formatPosition(position: SequencePosition | undefined): string {
  if (position === undefined) {
    return "";
  }
  const shown = (position.index + 1).toLocaleString();
  return position.total === undefined ? shown : `${shown} / ${position.total.toLocaleString()}`;
}

function handleKey(event: KeyboardEvent, props: {
  dialog: HTMLDialogElement;
  onShowNext: () => void;
  onShowPrevious: () => void;
  onClose: () => void;
}): void {
  const action = {
    ArrowRight: props.onShowNext,
    d: props.onShowNext,
    D: props.onShowNext,
    ArrowLeft: props.onShowPrevious,
    a: props.onShowPrevious,
    A: props.onShowPrevious,
    Backspace: props.onClose,
    Delete: props.onClose
  }[event.key];

  if (action !== undefined) {
    event.preventDefault();
    props.dialog.focus({ preventScroll: true });
    action();
  }
}

function handleClick(event: MouseEvent, onClose: () => void): void {
  if (event.target instanceof HTMLVideoElement) {
    return;
  }

  onClose();
}

function reportDismissal(dialog: HTMLDialogElement, current: Readable<MediaItem | undefined>, onClose: () => void): void {
  if (!dialog.open && current.peek() !== undefined) {
    onClose();
  }
}

function handleWheel(event: WheelEvent, onShowNext: () => void, onShowPrevious: () => void): void {
  if (event.ctrlKey || event.deltaY === 0) return;

  event.preventDefault();

  if (event.deltaY > 0) {
    onShowNext();
  } else {
    onShowPrevious();
  }
}
