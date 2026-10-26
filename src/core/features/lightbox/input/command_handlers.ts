import { LightboxActions } from "@/core/features/lightbox/actions/actions";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/autoplay";
import { LightboxCloser } from "@/core/features/lightbox/closer/closer";
import { LightboxCommandHandlers } from "@/core/features/lightbox/input/commands";
import { LightboxDetails } from "@/core/features/lightbox/details/details";
import { LightboxFullscreen } from "@/core/features/lightbox/fullscreen/fullscreen";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/navigation";
import { LightboxStage } from "@/core/features/lightbox/stage/stage";
import { LightboxZoom } from "@/core/features/lightbox/zoom/zoom";
import { MediaItem } from "@/core/domain/media/media_item";

export interface LightboxCommandTargets<T extends MediaItem> {
  readonly navigation: Pick<LightboxNavigation<T>, "currentItem" | "goToNext" | "goToPrevious">;
  readonly stage: Pick<LightboxStage<T>, "togglePause" | "toggleMute">;
  readonly fullscreen: Pick<LightboxFullscreen, "toggle">;
  readonly zoom: Pick<LightboxZoom, "isZoomed" | "toggle" | "zoomOut">;
  readonly autoplay: Pick<LightboxAutoplay, "toggle">;
  readonly closer: Pick<LightboxCloser<T>, "close">;
  readonly actions: LightboxActions;
  readonly details?: Pick<LightboxDetails<T>, "isOpen">;
}

export function createLightboxCommandHandlers<T extends MediaItem>(targets: LightboxCommandTargets<T>): LightboxCommandHandlers {
  const { navigation, stage, fullscreen, zoom, autoplay, closer, actions, details } = targets;
  const withCurrentItem = (run: (item: T) => void) => (): void => {
    const item = navigation.currentItem.peek();

    if (item !== undefined) {
      run(item);
    }
  };
  return {
    showNext: (): void => {
      navigation.goToNext().catch(console.error);
    },
    showPrevious: (): void => {
      navigation.goToPrevious().catch(console.error);
    },
    toggleAutoplay: (): void => autoplay.toggle(),
    togglePause: (): void => stage.togglePause(),
    toggleMute: (): void => stage.toggleMute(),
    toggleFullscreen: (): void => fullscreen.toggle(),
    toggleZoom: (): void => zoom.toggle(),
    toggleDetails: (): void => details?.isOpen.set(!details.isOpen.peek()),
    dismiss: (): void => (zoom.isZoomed.peek() ? zoom.zoomOut() : closer.close()),
    download: withCurrentItem(item => actions.download(item)),
    openPostPage: withCurrentItem(item => actions.openPostPage(item)),
    openOriginal: withCurrentItem(item => actions.openOriginal(item)),
    close: (): void => closer.close()
  };
}
