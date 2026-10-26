import { CommandHandlers } from "@/core/ui/hotkeys/command_handlers";
import { LightboxCommand } from "@/core/features/lightbox/input/lightbox_command";
import { LightboxActions } from "@/core/features/lightbox/actions/lightbox_actions";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/lightbox_autoplay";
import { LightboxCloser } from "@/core/features/lightbox/closer/lightbox_closer";
import { LightboxDetails } from "@/core/features/lightbox/details/lightbox_details";
import { LightboxFullscreen } from "@/core/features/lightbox/fullscreen/lightbox_fullscreen";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/lightbox_navigation";
import { LightboxStage } from "@/core/features/lightbox/stage/lightbox_stage";
import { LightboxZoom } from "@/core/features/lightbox/zoom/lightbox_zoom";
import { MediaItem } from "@/core/domain/media/media_item";

export interface LightboxCommandHandlersDependencies<T extends MediaItem> {
  readonly navigation: Pick<LightboxNavigation<T>, "currentItem" | "goToNext" | "goToPrevious">;
  readonly stage: Pick<LightboxStage<T>, "togglePause" | "toggleMute">;
  readonly fullscreen: Pick<LightboxFullscreen, "toggle">;
  readonly zoom: Pick<LightboxZoom, "isZoomed" | "toggle" | "zoomOut">;
  readonly autoplay: Pick<LightboxAutoplay, "toggle">;
  readonly closer: Pick<LightboxCloser<T>, "close">;
  readonly actions: LightboxActions;
  readonly details?: Pick<LightboxDetails<T>, "isOpen">;
}

export function createLightboxCommandHandlers<T extends MediaItem>(dependencies: LightboxCommandHandlersDependencies<T>): CommandHandlers<LightboxCommand> {
  const { navigation, stage, fullscreen, zoom, autoplay, closer, actions, details } = dependencies;
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
