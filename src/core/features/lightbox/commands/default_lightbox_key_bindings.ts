import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";

export const DEFAULT_LIGHTBOX_KEY_BINDINGS = {
  showNext: ["ArrowRight", "d"],
  showPrevious: ["ArrowLeft", "a"],
  close: ["Backspace", "Delete"],
  dismiss: ["Escape"],
  togglePause: [" ", "k"],
  toggleMute: ["m"],
  toggleFullscreen: ["f"],
  toggleZoom: ["z"],
  toggleAutoplay: ["p"],
  toggleDetails: ["i"],
  addFavorite: ["e"],
  openPostPage: [],
  openOriginal: [],
  download: []
} as const satisfies Record<LightboxCommand, readonly string[]>;
