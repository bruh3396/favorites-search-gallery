import { LightboxActions } from "@/core/features/lightbox2/actions";
import { LightboxAutoplay } from "@/core/features/lightbox2/autoplay";
import { LightboxCloser } from "@/core/features/lightbox2/closer";
import { LightboxCommandHandlers } from "@/core/features/lightbox2/commands";
import { LightboxFullscreen } from "@/core/features/lightbox2/fullscreen";
import { LightboxNavigation } from "@/core/features/lightbox2/navigation";
import { LightboxStage } from "@/core/features/lightbox2/stage";
import { LightboxZoom } from "@/core/features/lightbox2/zoom";
import { MediaItem } from "@/core/domain/post/post";

export interface LightboxCommandTargets<T extends MediaItem> {
  readonly navigation: Pick<LightboxNavigation<T>, "currentItem" | "goToNext" | "goToPrevious">;
  readonly stage: Pick<LightboxStage<T>, "togglePause" | "toggleMute">;
  readonly fullscreen: Pick<LightboxFullscreen, "toggle">;
  readonly zoom: Pick<LightboxZoom, "isZoomed" | "toggle" | "zoomOut">;
  readonly autoplay: Pick<LightboxAutoplay, "toggle">;
  readonly closer: Pick<LightboxCloser<T>, "close">;
  readonly actions: LightboxActions;
}

export function createLightboxCommandHandlers<T extends MediaItem>(targets: LightboxCommandTargets<T>): LightboxCommandHandlers {
  const { navigation, stage, fullscreen, zoom, autoplay, closer, actions } = targets;
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
    dismiss: (): void => (zoom.isZoomed.peek() ? zoom.zoomOut() : closer.close()),
    download: withCurrentItem(item => actions.download(item)),
    openPostPage: withCurrentItem(item => actions.openPostPage(item)),
    openOriginal: withCurrentItem(item => actions.openOriginal(item)),
    close: (): void => closer.close()
  };
}
