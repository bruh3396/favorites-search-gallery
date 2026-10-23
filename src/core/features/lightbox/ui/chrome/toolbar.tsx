import { Readable, computed } from "@/core/utils/reactive/signal";
import { LightboxButton } from "@/core/features/lightbox/ui/chrome/button";
import { LightboxCommandHandlers } from "@/core/features/lightbox/input/commands";
import { LightboxKeymap } from "@/core/features/lightbox/input/key_listener";
import { LightboxZoom } from "@/core/features/lightbox/zoom/zoom";
import { findLightboxShortcut } from "@/core/features/lightbox/input/shortcut";
import { h } from "@/core/ui/h/h";

export const LightboxToolbarClass = {
  root: "fsg-LightboxToolbar"
} as const;

export interface LightboxToolbarProps {
  zoom: Pick<LightboxZoom, "isZoomed" | "canZoom">;
  isAutoplaying: Readable<boolean>;
  inFullscreen: Readable<boolean>;
  handlers: LightboxCommandHandlers;
  keymap: LightboxKeymap;
}

export function LightboxToolbar({ zoom, isAutoplaying, inFullscreen, handlers, keymap }: LightboxToolbarProps): HTMLElement {
  return (
    <div className={LightboxToolbarClass.root}>
      <LightboxButton
        icon={computed(() => (isAutoplaying.value ? "pause" : "play"))}
        label="Autoplay"
        shortcut={findLightboxShortcut(keymap, "toggleAutoplay")}
        pressed={isAutoplaying}
        onClick={handlers.toggleAutoplay}
      />
      <LightboxButton icon="download" label="Download" shortcut={findLightboxShortcut(keymap, "download")} onClick={handlers.download} />
      <LightboxButton
        icon={computed(() => (zoom.isZoomed.value ? "zoomOut" : "zoomIn"))}
        label="Zoom"
        shortcut={findLightboxShortcut(keymap, "toggleZoom")}
        pressed={zoom.isZoomed}
        disabled={computed(() => !zoom.canZoom.value)}
        onClick={handlers.toggleZoom}
      />
      <LightboxButton
        icon={computed(() => (inFullscreen.value ? "exitFullscreen" : "fullscreen"))}
        label="Fullscreen"
        shortcut={findLightboxShortcut(keymap, "toggleFullscreen")}
        pressed={inFullscreen}
        onClick={handlers.toggleFullscreen}
      />
      <LightboxButton icon="postPage" label="Open post page" shortcut={findLightboxShortcut(keymap, "openPostPage")} onClick={handlers.openPostPage} />
      <LightboxButton icon="close" label="Close" shortcut={findLightboxShortcut(keymap, "dismiss")} onClick={handlers.close} />
    </div>
  ) as HTMLElement;
}
