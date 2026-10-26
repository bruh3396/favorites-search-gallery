import { Readable, computed } from "@/core/utils/reactive/signal";
import { LightboxButton } from "@/core/features/lightbox/ui/chrome/button";
import { LightboxCommandHandlers } from "@/core/features/lightbox/input/commands";
import { LightboxKeymap } from "@/core/features/lightbox/input/key_listener";
import { findLightboxShortcut } from "@/core/features/lightbox/input/shortcut";
import { h } from "@/core/ui/h/h";

export const LightboxToolbarClass = {
  root: "fsg-LightboxToolbar"
} as const;

export interface LightboxToolbarProps {
  isAutoplaying: Readable<boolean>;
  inFullscreen: Readable<boolean>;
  detailsOpen?: Readable<boolean>;
  handlers: LightboxCommandHandlers;
  keymap: LightboxKeymap;
}

export function LightboxToolbar({ isAutoplaying, inFullscreen, detailsOpen, handlers, keymap }: LightboxToolbarProps): HTMLElement {
  return (
    <div className={LightboxToolbarClass.root}>
      <LightboxButton
        icon={computed(() => (isAutoplaying.value ? "pause" : "play"))}
        label="Autoplay"
        shortcut={findLightboxShortcut(keymap, "toggleAutoplay")}
        pressed={isAutoplaying}
        onClick={handlers.toggleAutoplay}
      />
      {detailsOpen === undefined ? null : (
        <LightboxButton
          icon="info"
          label="Details"
          shortcut={findLightboxShortcut(keymap, "toggleDetails")}
          pressed={detailsOpen}
          onClick={handlers.toggleDetails}
        />
      )}
      {/* Hidden for now:
        <LightboxButton icon="download" label="Download" shortcut={findLightboxShortcut(keymap, "download")} onClick={handlers.download} />
      */}
      <LightboxButton icon="postPage" label="Open post page" shortcut={findLightboxShortcut(keymap, "openPostPage")} onClick={handlers.openPostPage} />
      <LightboxButton
        icon={computed(() => (inFullscreen.value ? "exitFullscreen" : "fullscreen"))}
        label="Fullscreen"
        shortcut={findLightboxShortcut(keymap, "toggleFullscreen")}
        pressed={inFullscreen}
        onClick={handlers.toggleFullscreen}
      />
      <LightboxButton icon="close" label="Close" shortcut={findLightboxShortcut(keymap, "dismiss")} onClick={handlers.close} />
    </div>
  ) as HTMLElement;
}
