import { LightboxCommand, LightboxCommandHandlers } from "@/core/features/lightbox2/commands";

export type LightboxKeymap = Readonly<Record<string, LightboxCommand>>;

export const DEFAULT_LIGHTBOX_KEYMAP: LightboxKeymap = {
  ArrowRight: "showNext",
  d: "showNext",
  D: "showNext",
  ArrowLeft: "showPrevious",
  a: "showPrevious",
  A: "showPrevious",
  " ": "toggleAutoplay",
  k: "togglePause",
  K: "togglePause",
  m: "toggleMute",
  M: "toggleMute",
  f: "toggleFullscreen",
  F: "toggleFullscreen",
  z: "toggleZoom",
  Z: "toggleZoom",
  Escape: "dismiss",
  Backspace: "close",
  Delete: "close"
};

export function createLightboxKeyListener(keymap: LightboxKeymap, handlers: LightboxCommandHandlers): (event: KeyboardEvent) => void {
  return event => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const command = keymap[event.key];

    if (command !== undefined) {
      event.preventDefault();

      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.focus({ preventScroll: true });
      }
      handlers[command]();
    }
  };
}
