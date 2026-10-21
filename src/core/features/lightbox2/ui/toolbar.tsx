import { Readable, computed } from "@/core/utils/reactive/signal";
import { LightboxButton } from "@/core/features/lightbox2/ui/button";
import { LightboxCommandHandlers } from "@/core/features/lightbox2/commands";
import { LightboxZoom } from "@/core/features/lightbox2/zoom";
import { h } from "@/core/ui/h/h";

export const LightboxToolbarClass = {
  root: "fsg-LightboxToolbar"
} as const;

export interface LightboxToolbarProps {
  zoom: Pick<LightboxZoom, "isZoomed" | "canZoom">;
  isAutoplaying: Readable<boolean>;
  inFullscreen: Readable<boolean>;
  handlers: LightboxCommandHandlers;
}

export function LightboxToolbar({ zoom, isAutoplaying, inFullscreen, handlers }: LightboxToolbarProps): HTMLElement {
  return (
    <div className={LightboxToolbarClass.root}>
      <LightboxButton
        icon={computed(() => (isAutoplaying.value ? "pause" : "play"))}
        label="Autoplay"
        pressed={isAutoplaying}
        onClick={handlers.toggleAutoplay}
      />
      <LightboxButton icon="download" label="Download" onClick={handlers.download} />
      <LightboxButton
        icon={computed(() => (zoom.isZoomed.value ? "zoomOut" : "zoomIn"))}
        label="Zoom"
        pressed={zoom.isZoomed}
        disabled={computed(() => !zoom.canZoom.value)}
        onClick={handlers.toggleZoom}
      />
      <LightboxButton
        icon={computed(() => (inFullscreen.value ? "exitFullscreen" : "fullscreen"))}
        label="Fullscreen"
        pressed={inFullscreen}
        onClick={handlers.toggleFullscreen}
      />
      <LightboxButton icon="postPage" label="Open post page" onClick={handlers.openPostPage} />
      <LightboxButton icon="close" label="Close" onClick={handlers.close} />
    </div>
  ) as HTMLElement;
}
