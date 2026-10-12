import { LightboxAutoplay, LightboxAutoplayConfiguration } from "@/core/ui/lightbox/autoplay/autoplay";
import { MorphSource, Morpher } from "@/core/boundary/ports/morpher/morpher";
import { OverlayVisibility, OverlayVisibilityConfiguration } from "@/core/ui/lightbox/overlay/visibility";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { FullscreenToggle } from "@/core/ui/lightbox/screen/fullscreen_toggle";
import { Lightbox } from "@/core/ui/lightbox/lightbox";
import { LightboxControls } from "@/core/ui/lightbox/controls/controls";
import { LightboxFavoriteButtonProps } from "@/core/ui/lightbox/controls/favorite_button/favorite_button";
import { LightboxKeys } from "@/core/ui/lightbox/screen/keys";
import { LightboxStage } from "@/core/ui/lightbox/stage/stage";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { closeIntoPage } from "@/core/ui/lightbox/screen/close";
import { createPointerListeners } from "@/core/ui/lightbox/screen/pointer";
import { h } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";

export const LightboxScreenClass = {
  root: "fsg-LightboxScreen",
  content: "fsg-LightboxScreen-content"
} as const;

const OVERLAY_VISIBILITY: OverlayVisibilityConfiguration = { idleDelay: 1_000, shortDelay: 1_000 };
const AUTOPLAY: LightboxAutoplayConfiguration = { interval: 3_000 };

export interface LightboxScreenProps<T extends MediaItem> {
  lightbox: Lightbox<T>;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  resolveOriginalUrl: (media: Media) => Promise<string>;
  decodeOriginal: (media: Media, signal: AbortSignal) => Promise<ImageBitmap>;
  scheduler: Pick<Scheduler, "schedule">;
  morpher?: Morpher;
  locateItem: (item: T) => Element | undefined;
  favorites?: Omit<LightboxFavoriteButtonProps<T>, "current">;
  onCtrlClick?: (item: T) => void;
  onMiddleClick?: (item: T) => void;
  onDownload?: (item: T) => void;
  onOpenPostPage?: (item: T) => void;
}

export function LightboxScreen<T extends MediaItem>(props: LightboxScreenProps<T>): HTMLElement {
  const { lightbox, scheduler } = props;
  const { current } = lightbox;
  const onShowNext = (): void => {
    lightbox.showNext().catch(console.error);
  };
  const onShowPrevious = (): void => {
    lightbox.showPrevious().catch(console.error);
  };
  const withCurrent = (onItem: ((item: T) => void) | undefined): (() => void) | undefined => onItem && (() => {
    const item = current.peek();

    if (item !== undefined) {
      onItem(item);
    }
  });
  let readShownMedia: () => MorphSource | undefined;
  const onClose = (): void => closeIntoPage(readShownMedia(), props);
  const visibility = new OverlayVisibility(OVERLAY_VISIBILITY, scheduler);
  const autoplay = new LightboxAutoplay(AUTOPLAY, { current, showNext: onShowNext, scheduler });
  const content = (
    <div className={LightboxScreenClass.content}>
      <LightboxStage
        current={current}
        neighbors={lightbox.neighbors}
        warmItems={lightbox.warmItems}
        resolvePreviewUrl={props.resolvePreviewUrl}
        resolveOriginalUrl={props.resolveOriginalUrl}
        decodeOriginal={props.decodeOriginal}
        scheduler={scheduler}
        exposeShownMedia={read => {
          readShownMedia = read;
        }}
      />
    </div>
  ) as HTMLElement;
  const fullscreen = new FullscreenToggle(content);
  const dialog = (
    <dialog
      className={LightboxScreenClass.root}
      dataset={{ idle: computed(() => String(!visibility.shown.value)) }}
      aria-label="Gallery"
      autofocus
      tabIndex={-1}
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      onClose={event => reportDismissal(event.currentTarget, current, () => lightbox.close())}
      {...createPointerListeners({
        visibility, onShowNext, onShowPrevious, onClose, onCtrlClick: withCurrent(props.onCtrlClick), onMiddleClick: withCurrent(props.onMiddleClick)
      })}
    >
      {content}
    </dialog>
  ) as HTMLDialogElement;
  const keys = new LightboxKeys({ dialog, onShowNext, onShowPrevious, onClose, onToggleAutoplay: () => autoplay.toggle() });

  // Media events don't bubble, so only a capturing listener hears the video end.
  content.addEventListener("ended", event => {
    if (event.target === readShownMedia()) {
      autoplay.finishVideo();
    }
  }, true);
  content.append(<LightboxControls
      visibility={visibility}
      current={current}
      position={lightbox.position}
      autoplay={autoplay}
      fullscreen={fullscreen}
      favorites={props.favorites}
      onDownload={withCurrent(props.onDownload)}
      onOpenPostPage={withCurrent(props.onOpenPostPage)}
      onClose={onClose}
      onShowNext={onShowNext}
      onShowPrevious={onShowPrevious}
    />);
  effect(() => {
    if (current.value === undefined) {
      keys.stop();
      visibility.hide();
      autoplay.stop();
      fullscreen.exit();
      dialog.close();
    } else if (!dialog.open) {
      keys.listen();
      dialog.showModal();
      dialog.focus({ preventScroll: true });
      visibility.show();
    }
  });
  onCleanup(() => {
    keys.stop();
    visibility.hide();
    autoplay.dispose();
  });
  return dialog;
}

function reportDismissal(dialog: HTMLDialogElement, current: Readable<MediaItem | undefined>, onClose: () => void): void {
  if (!dialog.open && current.peek() !== undefined) {
    onClose();
  }
}
