import { Child, h } from "@/core/ui/h/h";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { CommandHandlers } from "@/core/ui/hotkeys/command_handlers";
import { Keymap } from "@/core/ui/hotkeys/keymap";
import { LightboxButton } from "@/core/features/lightbox/overlay/lightbox_button";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { findLightboxShortcut } from "@/core/features/lightbox/commands/lightbox_shortcut_finder";

export const LightboxToolbarClass = {
  root: "fsg-LightboxToolbar"
} as const;

export interface LightboxToolbarProps {
  isAutoplaying: Readable<boolean>;
  inFullscreen: Readable<boolean>;
  detailsOpen?: Readable<boolean>;
  leadingChild?: Child;
  handlers: CommandHandlers<LightboxCommand>;
  keymap: Keymap<LightboxCommand>;
}

export function LightboxToolbar({ isAutoplaying, inFullscreen, detailsOpen, leadingChild, handlers, keymap }: LightboxToolbarProps): HTMLElement {
  return (
    <div className={LightboxToolbarClass.root}>
      {leadingChild}
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
      <span hidden>
        <LightboxButton icon="download" label="Download" lightboxShortcut={findLightboxShortcut(keymap, "download")} onClick={handlers.download} />
      </span>
      <LightboxButton icon="postPage" label="Open Post Page" lightboxShortcut={findLightboxShortcut(keymap, "openPostPage")} onClick={handlers.openPostPage} />
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
