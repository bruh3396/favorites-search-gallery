import { LightboxCommand, LightboxCommands } from "@/core/features/lightbox2/commands";

export type LightboxKeymap = Readonly<Record<string, LightboxCommand>>;

export const DEFAULT_LIGHTBOX_KEYMAP: LightboxKeymap = {
  ArrowRight: "showNext",
  ArrowLeft: "showPrevious",
  " ": "togglePause",
  m: "toggleMute",
  M: "toggleMute",
  f: "toggleFullscreen",
  F: "toggleFullscreen"
};

export function createLightboxKeyListener(keymap: LightboxKeymap, commands: LightboxCommands): (event: KeyboardEvent) => void {
  return event => {
    const command = keymap[event.key];

    if (command !== undefined) {
      event.preventDefault();

      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.focus({ preventScroll: true });
      }
      commands[command]();
    }
  };
}
