import { LightboxZoom, ZoomPoint } from "@/core/features/lightbox/zoom/zoom";
import { LightboxActions } from "@/core/features/lightbox/actions/actions";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/autoplay";
import { LightboxFullscreen } from "@/core/features/lightbox/ui/screen/fullscreen";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/navigation";
import { LightboxStage } from "@/core/features/lightbox/ui/stage/stage";
import { MediaItem } from "@/core/domain/post/post";
import { Morpher } from "@/core/boundary/ports/morpher/morpher";
import { closeIntoTile } from "@/core/features/lightbox/commands/close";

export interface LightboxCommands {
  showNext: () => void;
  showPrevious: () => void;
  close: () => void;
  toggleAutoplay: () => void;
  toggleZoom: (point?: ZoomPoint) => void;
  zoomBy: (factor: number, point: ZoomPoint) => void;
  zoomOut: () => void;
  panBy: (deltaX: number, deltaY: number) => void;
  toggleFullscreen: () => void;
  download: () => void;
  openOriginal: () => void;
  openPostPage: () => void;
}

export type LightboxCommandName = keyof LightboxCommands;

export interface LightboxCommandsDependencies<T extends MediaItem> {
  navigation: Pick<LightboxNavigation<T>, "current" | "showNext" | "showPrevious" | "close">;
  autoplay: Pick<LightboxAutoplay, "toggle">;
  zoom: Pick<LightboxZoom, "toggle" | "zoomBy" | "zoomOut" | "panBy">;
  actions: Pick<LightboxActions, "download" | "openOriginal" | "openPostPage">;
  fullscreen: Pick<LightboxFullscreen, "toggle">;
  stage: Pick<LightboxStage, "shownMedia">;
  morpher?: Morpher;
  locateItem: (item: T) => Element | undefined;
}

export function createLightboxCommands<T extends MediaItem>(dependencies: LightboxCommandsDependencies<T>): LightboxCommands {
  const { navigation, autoplay, zoom, actions, fullscreen, stage, morpher, locateItem } = dependencies;
  const withCurrent = (act: (item: T) => void) => (): void => {
    const item = navigation.current.peek();

    if (item !== undefined) {
      act(item);
    }
  };
  return {
    showNext: (): void => {
      navigation.showNext().catch(console.error);
    },
    showPrevious: (): void => {
      navigation.showPrevious().catch(console.error);
    },
    close: () => closeIntoTile(stage.shownMedia, { navigation, morpher, locateItem }),
    toggleAutoplay: () => autoplay.toggle(),
    toggleZoom: point => zoom.toggle(point),
    zoomBy: (factor, point) => zoom.zoomBy(factor, point),
    zoomOut: () => zoom.zoomOut(),
    panBy: (deltaX, deltaY) => zoom.panBy(deltaX, deltaY),
    toggleFullscreen: () => fullscreen.toggle(),
    download: withCurrent(item => actions.download(item)),
    openOriginal: withCurrent(item => actions.openOriginal(item)),
    openPostPage: withCurrent(item => actions.openPostPage(item))
  };
}
