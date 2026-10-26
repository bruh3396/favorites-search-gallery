import { Keymap } from "@/core/ui/hotkeys/keymap";

export type FavoritesCommand = "toggleZen" | "exitZen";

export const DEFAULT_FAVORITES_KEYMAP: Keymap<FavoritesCommand> = {
  z: "toggleZen",
  Z: "toggleZen",
  Escape: "exitZen"
};
