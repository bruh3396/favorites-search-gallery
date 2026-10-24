import { LightboxKeymap } from "@/core/features/lightbox/input/key_listener";

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
  i: "toggleDetails",
  I: "toggleDetails",
  Escape: "dismiss",
  Backspace: "close",
  Delete: "close"
};
