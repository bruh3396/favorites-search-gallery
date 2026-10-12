import { DEFAULT_LIGHTBOX_STAGE_CONFIGURATION, LightboxStage, LightboxStageDependencies } from "@/core/features/lightbox/ui/stage/stage";
import { LightboxOverlayVisibility, LightboxOverlayVisibilityConfiguration } from "@/core/features/lightbox/ui/overlay/visibility";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { LightboxActions } from "@/core/features/lightbox/actions/actions";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/autoplay";
import { LightboxControls } from "@/core/features/lightbox/ui/controls/controls";
import { LightboxFavoriteButtonProps } from "@/core/features/lightbox/ui/controls/favorite_button/favorite_button";
import { LightboxFullscreen } from "@/core/features/lightbox/ui/screen/fullscreen";
import { LightboxKeys } from "@/core/features/lightbox/ui/screen/keys";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/navigation";
import { MediaItem } from "@/core/domain/post/post";
import { Morpher } from "@/core/boundary/ports/morpher/morpher";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { closeIntoTile } from "@/core/features/lightbox/ui/screen/close";
import { createPointerListeners } from "@/core/features/lightbox/ui/screen/pointer";
import { h } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";

export const LightboxScreenClass = {
  root: "fsg-LightboxScreen",
  content: "fsg-LightboxScreen-content"
} as const;

export interface LightboxScreenProps<T extends MediaItem> {
  navigation: Pick<LightboxNavigation<T>, "current" | "neighbors" | "warmItems" | "position" | "showNext" | "showPrevious" | "close">;
  autoplay: Pick<LightboxAutoplay, "isPlaying" | "countdown" | "toggle" | "showNextAfterVideo">;
  actions: Pick<LightboxActions, "openOriginal" | "openPostPage" | "download">;
  remoteMedia: LightboxStageDependencies["remoteMedia"];
  overlay: LightboxOverlayVisibilityConfiguration;
  scheduler: Pick<Scheduler, "schedule">;
  morpher?: Morpher;
  locateItem: (item: T) => Element | undefined;
  favorites?: Omit<LightboxFavoriteButtonProps<T>, "current">;
}

export function LightboxScreen<T extends MediaItem>(props: LightboxScreenProps<T>): HTMLElement {
  const { navigation, autoplay, actions, scheduler } = props;
  const { current } = navigation;
  const showNext = (): void => {
    navigation.showNext().catch(console.error);
  };
  const showPrevious = (): void => {
    navigation.showPrevious().catch(console.error);
  };
  const withCurrent = (onItem: (item: T) => void): (() => void) => (): void => {
    const item = current.peek();

    if (item !== undefined) {
      onItem(item);
    }
  };
  const stage = new LightboxStage(DEFAULT_LIGHTBOX_STAGE_CONFIGURATION, {
    current, neighbors: navigation.neighbors, warmItems: navigation.warmItems, remoteMedia: props.remoteMedia, scheduler
  });
  const close = (): void => closeIntoTile(stage.shownMedia, { navigation, morpher: props.morpher, locateItem: props.locateItem });
  const visibility = new LightboxOverlayVisibility(props.overlay, scheduler);
  const content = <div className={LightboxScreenClass.content}>{stage.root}</div> as HTMLElement;
  const fullscreen = new LightboxFullscreen(content);
  const dialog = (
    <dialog
      className={LightboxScreenClass.root}
      dataset={{ idle: computed(() => String(!visibility.shown.value)) }}
      aria-label="Gallery"
      autofocus
      tabIndex={-1}
      onCancel={event => {
        event.preventDefault();
        close();
      }}
      onClose={(event): void => reportDismissal(event.currentTarget, current, () => navigation.close())}
      {...createPointerListeners({
        visibility, showNext, showPrevious, close,
        onCtrlClick: withCurrent(item => actions.openOriginal(item)),
        onMiddleClick: withCurrent(item => actions.openPostPage(item))
      })}
    >
      {content}
    </dialog>
  ) as HTMLDialogElement;
  const keys = new LightboxKeys({ dialog, showNext, showPrevious, close, toggleAutoplay: (): void => autoplay.toggle() });

  // Media events don't bubble, so only a capturing listener hears the video end.
  content.addEventListener("ended", event => {
    if (event.target === stage.shownMedia) {
      autoplay.showNextAfterVideo();
    }
  }, true);
  content.append(<LightboxControls
    visibility={visibility}
    current={current}
    position={navigation.position}
    autoplay={autoplay}
    fullscreen={fullscreen}
    favorites={props.favorites}
    download={withCurrent(item => actions.download(item))}
    openPostPage={withCurrent(item => actions.openPostPage(item))}
    close={close}
    showNext={showNext}
    showPrevious={showPrevious}
  />);
  effect(() => {
    if (current.value === undefined) {
      keys.stop();
      visibility.hide();
      fullscreen.exit();
      dialog.close();
    } else if (!dialog.open) {
      keys.start();
      dialog.showModal();
      dialog.focus({ preventScroll: true });
      visibility.show();
    }
  });
  onCleanup(() => {
    keys.stop();
    visibility.hide();
    stage.dispose();
  });
  return dialog;
}

function reportDismissal(dialog: HTMLDialogElement, current: Readable<MediaItem | undefined>, close: () => void): void {
  if (!dialog.open && current.peek() !== undefined) {
    close();
  }
}
