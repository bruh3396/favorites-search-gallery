import { Readable, computed } from "@/core/utils/reactive/signal";
import { CommandHandlers } from "@/core/ui/hotkeys/command_handlers";
import { Keymap } from "@/core/ui/hotkeys/keymap";
import { LightboxButton } from "@/core/features/lightbox/overlay/lightbox_button";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { findLightboxShortcut } from "@/core/features/lightbox/commands/lightbox_shortcut_finder";
import { h } from "@/core/ui/h/h";

export const LightboxToolbarClass = {
  root: "fsg-LightboxToolbar"
} as const;

export interface LightboxToolbarProps {
  isAutoplaying: Readable<boolean>;
  inFullscreen: Readable<boolean>;
  detailsOpen?: Readable<boolean>;
  handlers: CommandHandlers<LightboxCommand>;
  keymap: Keymap<LightboxCommand>;
}

export function LightboxToolbar({ isAutoplaying, inFullscreen, detailsOpen, handlers, keymap }: LightboxToolbarProps): HTMLElement {
  return (
    <div className={LightboxToolbarClass.root}>
      <LightboxButton
        icon={computed(() => (isAutoplaying.value ? "pause" : "play"))}
        label="Autoplay"
        lightboxShortcut={findLightboxShortcut(keymap, "toggleAutoplay")}
        pressed={isAutoplaying}
        onClick={handlers.toggleAutoplay}
      />
      {detailsOpen === undefined ? null : (
        <LightboxButton
          icon="info"
          label="Details"
          lightboxShortcut={findLightboxShortcut(keymap, "toggleDetails")}
          pressed={detailsOpen}
          onClick={handlers.toggleDetails}
        />
      )}
      {/* Hidden for now:
        <LightboxButton icon="download" label="Download" shortcut={findLightboxShortcut(keymap, "download")} onClick={handlers.download} />
      */}
      <LightboxButton icon="postPage" label="Open post page" lightboxShortcut={findLightboxShortcut(keymap, "openPostPage")} onClick={handlers.openPostPage} />
      <LightboxButton
        icon={computed(() => (inFullscreen.value ? "exitFullscreen" : "fullscreen"))}
        label="Fullscreen"
        lightboxShortcut={findLightboxShortcut(keymap, "toggleFullscreen")}
        pressed={inFullscreen}
        onClick={handlers.toggleFullscreen}
      />
      <LightboxButton icon="close" label="Close" lightboxShortcut={findLightboxShortcut(keymap, "dismiss")} onClick={handlers.close} />
    </div>
  ) as HTMLElement;
}
