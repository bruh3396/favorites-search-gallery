import { Child, h } from "@/core/ui/h/h";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { CommandHandlers } from "@/core/ui/key_bindings/command_handlers";
import { LightboxButton } from "@/core/features/lightbox/overlay/lightbox_button";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";

export const LightboxToolbarClass = {
  root: "fsg-LightboxToolbar"
} as const;

export interface LightboxToolbarProps {
  isAutoplaying: Readable<boolean>;
  inFullscreen: Readable<boolean>;
  detailsOpen?: Readable<boolean>;
  leadingChild?: Child;
  handlers: CommandHandlers<LightboxCommand>;
}

export function LightboxToolbar({ isAutoplaying, inFullscreen, detailsOpen, leadingChild, handlers }: LightboxToolbarProps): HTMLElement {
  return (
    <div className={LightboxToolbarClass.root}>
      {leadingChild}
      <LightboxButton
        icon={computed(() => (isAutoplaying.value ? "pause" : "play"))}
        label="Autoplay"
        pressed={isAutoplaying}
        onClick={handlers.toggleAutoplay}
      />
      {detailsOpen === undefined ? null : (
        <LightboxButton icon="info" label="Details" pressed={detailsOpen} onClick={handlers.toggleDetails} />
      )}
      <span hidden>
        <LightboxButton icon="download" label="Download" onClick={handlers.download} />
      </span>
      <LightboxButton icon="postPage" label="Open Post Page" onClick={handlers.openPostPage} />
      <LightboxButton
        icon={computed(() => (inFullscreen.value ? "exitFullscreen" : "fullscreen"))}
        label="Fullscreen"
        pressed={inFullscreen}
        onClick={handlers.toggleFullscreen}
      />
      <LightboxButton icon="close" label="Close" onClick={handlers.close} />
    </div>
  ) as HTMLElement;
}
