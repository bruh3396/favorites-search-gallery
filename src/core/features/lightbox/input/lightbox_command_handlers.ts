import { CommandHandlers } from "@/core/ui/hotkeys/command_handlers";
import { LightboxActions } from "@/core/features/lightbox/actions/lightbox_actions";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/lightbox_autoplay";
import { LightboxCloser } from "@/core/features/lightbox/closer/lightbox_closer";
import { LightboxCommand } from "@/core/features/lightbox/input/lightbox_command";
import { LightboxDetails } from "@/core/features/lightbox/details/lightbox_details";
import { LightboxFullscreen } from "@/core/features/lightbox/fullscreen/lightbox_fullscreen";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/lightbox_navigation";
import { LightboxStage } from "@/core/features/lightbox/stage/lightbox_stage";
import { LightboxZoom } from "@/core/features/lightbox/zoom/lightbox_zoom";
import { MediaItem } from "@/core/domain/media/media_item";

export interface LightboxCommandHandlersDependencies<T extends MediaItem> {
  lightboxNavigation: Pick<LightboxNavigation<T>, "currentItem" | "goToNext" | "goToPrevious">;
  lightboxStage: Pick<LightboxStage<T>, "togglePause" | "toggleMute">;
  lightboxFullscreen: Pick<LightboxFullscreen, "toggle">;
  lightboxZoom: Pick<LightboxZoom, "isZoomed" | "toggle" | "zoomOut">;
  lightboxAutoplay: Pick<LightboxAutoplay, "toggle">;
  lightboxCloser: Pick<LightboxCloser<T>, "close">;
  lightboxActions: LightboxActions;
  lightboxDetails?: Pick<LightboxDetails<T>, "isOpen">;
}

export function createLightboxCommandHandlers<T extends MediaItem>(dependencies: LightboxCommandHandlersDependencies<T>): CommandHandlers<LightboxCommand> {
  const {
    lightboxNavigation, lightboxStage, lightboxFullscreen, lightboxZoom, lightboxAutoplay, lightboxCloser, lightboxActions, lightboxDetails
  } = dependencies;
  const withCurrentItem = (run: (item: T) => void) => (): void => {
    const item = lightboxNavigation.currentItem.peek();

    if (item !== undefined) {
      run(item);
    }
  };
  return {
    showNext: (): void => {
      lightboxNavigation.goToNext().catch(console.error);
    },
    showPrevious: (): void => {
      lightboxNavigation.goToPrevious().catch(console.error);
    },
    toggleAutoplay: (): void => lightboxAutoplay.toggle(),
    togglePause: (): void => lightboxStage.togglePause(),
    toggleMute: (): void => lightboxStage.toggleMute(),
    toggleFullscreen: (): void => lightboxFullscreen.toggle(),
    toggleZoom: (): void => lightboxZoom.toggle(),
    toggleDetails: (): void => lightboxDetails?.isOpen.set(!lightboxDetails.isOpen.peek()),
    dismiss: (): void => (lightboxZoom.isZoomed.peek() ? lightboxZoom.zoomOut() : lightboxCloser.close()),
    download: withCurrentItem(item => lightboxActions.download(item)),
    openPostPage: withCurrentItem(item => lightboxActions.openPostPage(item)),
    openOriginal: withCurrentItem(item => lightboxActions.openOriginal(item)),
    close: (): void => lightboxCloser.close()
  };
}
