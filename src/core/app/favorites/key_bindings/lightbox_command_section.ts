import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";

export const LIGHTBOX_COMMAND_SECTION = {
  title: "Gallery",
  lightboxCommands: [
    "showNext", "showPrevious", "togglePause", "toggleMute", "toggleAutoplay", "toggleZoom", "toggleFullscreen",
    "toggleDetails", "addFavorite", "openPostPage", "openOriginal", "download", "dismiss", "close"
  ]
} as const satisfies { title: string; lightboxCommands: readonly LightboxCommand[] };
