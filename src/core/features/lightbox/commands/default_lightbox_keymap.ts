import { Keymap } from "@/core/ui/hotkeys/keymap";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";

export const DEFAULT_LIGHTBOX_KEYMAP: Keymap<LightboxCommand> = {
  ArrowRight: "showNext",
  d: "showNext",
  D: "showNext",
  ArrowLeft: "showPrevious",
  a: "showPrevious",
  A: "showPrevious",
  p: "toggleAutoplay",
  P: "toggleAutoplay",
  " ": "togglePause",
  k: "togglePause",
  K: "togglePause",
  m: "toggleMute",
  M: "toggleMute",
  f: "toggleFullscreen",
  F: "toggleFullscreen",
  z: "toggleZoom",
  Z: "toggleZoom",
  i: "toggleDetails",
  I: "toggleDetails",
  Escape: "dismiss",
  Backspace: "close",
  Delete: "close"
};
