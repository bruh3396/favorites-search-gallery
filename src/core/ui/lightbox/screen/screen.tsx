import { MorphSource, Morpher } from "@/core/boundary/ports/morpher/morpher";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { Lightbox } from "@/core/ui/lightbox/lightbox";
import { LightboxStage } from "@/core/ui/lightbox/stage/stage";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SequencePosition } from "@/core/domain/media/media_sequence";
import { h } from "@/core/ui/h/h";

export const LightboxScreenClass = {
  root: "fsg-LightboxScreen",
  position: "fsg-LightboxScreen-position"
} as const;

export interface LightboxScreenProps<T extends MediaItem> {
  lightbox: Lightbox<T>;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  resolveOriginalUrl: (media: Media) => Promise<string>;
  decodeOriginal: (media: Media, signal: AbortSignal) => Promise<ImageBitmap>;
  scheduler: Pick<Scheduler, "schedule">;
  morpher?: Morpher;
  locateItem: (item: T) => Element | undefined;
}

export function LightboxScreen<T extends MediaItem>(props: LightboxScreenProps<T>): HTMLElement {
  const { lightbox, resolvePreviewUrl, resolveOriginalUrl, decodeOriginal, scheduler } = props;
  const { current, neighbors, warmItems, position } = lightbox;
  const onShowNext = (): void => {
    lightbox.showNext().catch(console.error);
  };
  const onShowPrevious = (): void => {
    lightbox.showPrevious().catch(console.error);
  };
  let readShownMedia: () => MorphSource | undefined;
  const onClose = (): void => closeIntoPage(readShownMedia(), props);
  const dialog = (
    <dialog
      className={LightboxScreenClass.root}
      aria-label="Gallery"
      autofocus
      tabIndex={-1}
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      onClose={event => reportDismissal(event.currentTarget, current, () => lightbox.close())}
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
        warmItems={warmItems}
        resolvePreviewUrl={resolvePreviewUrl}
        resolveOriginalUrl={resolveOriginalUrl}
        decodeOriginal={decodeOriginal}
        scheduler={scheduler}
        exposeShownMedia={read => {
          readShownMedia = read;
        }}
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

function closeIntoPage<T extends MediaItem>(media: MorphSource | undefined, { lightbox, morpher, locateItem }: LightboxScreenProps<T>): void {
  const item = lightbox.current.peek();

  if (item === undefined || media === undefined || morpher === undefined) {
    lightbox.close();
    return;
  }
  morpher.morph(media, () => {
    lightbox.close();
    return locateItem(item);
  });
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
