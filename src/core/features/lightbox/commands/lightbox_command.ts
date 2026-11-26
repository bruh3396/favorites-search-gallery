import { CommandDefinition } from "@/core/ui/key_bindings/command_definition";

export const LIGHTBOX_COMMAND_DEFINITIONS = {
  showNext: { label: "Go to Next", repeatable: true },
  showPrevious: { label: "Go to Previous", repeatable: true },
  togglePause: { label: "Play/Pause" },
  toggleMute: { label: "Toggle Mute" },
  toggleAutoplay: { label: "Toggle Autoplay" },
  toggleZoom: { label: "Toggle Zoom" },
  toggleFullscreen: { label: "Toggle Fullscreen" },
  toggleDetails: { label: "Toggle Details" },
  addFavorite: { label: "Add to Favorites" },
  openPostPage: { label: "Open Post Page" },
  openOriginal: { label: "Open Original" },
  download: { label: "Download" },
  dismiss: { label: "Dismiss" },
  close: { label: "Close" }
} as const satisfies Readonly<Record<string, CommandDefinition>>;

export type LightboxCommand = keyof typeof LIGHTBOX_COMMAND_DEFINITIONS;
