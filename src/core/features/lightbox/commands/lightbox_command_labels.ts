import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";

export const LIGHTBOX_COMMAND_LABELS = {
  showNext: "Show Next",
  showPrevious: "Show Previous",
  togglePause: "Toggle Pause",
  toggleMute: "Toggle Mute",
  toggleAutoplay: "Toggle Autoplay",
  toggleZoom: "Toggle Zoom",
  toggleFullscreen: "Toggle Fullscreen",
  toggleDetails: "Toggle Details",
  addFavorite: "Add to Favorites",
  openPostPage: "Open Post Page",
  openOriginal: "Open Original",
  download: "Download",
  dismiss: "Dismiss",
  close: "Close"
} as const satisfies Record<LightboxCommand, string>;
