import { Keymap } from "@/core/ui/hotkeys/keymap";
import { LightboxCommand } from "@/core/features/lightbox/input/lightbox_command";

export interface LightboxShortcut {
  readonly text: string;
  readonly ariaName: string;
}

const TEXTS: Readonly<Record<string, string>> = { " ": "Space", ArrowLeft: "←", ArrowRight: "→", Escape: "Esc" };

export function findLightboxShortcut(keymap: Keymap<LightboxCommand>, lightboxCommand: LightboxCommand): LightboxShortcut | undefined {
  const key = Object.keys(keymap).find(candidate => keymap[candidate] === lightboxCommand);

  if (key === undefined) {
    return undefined;
  }
  return {
    text: TEXTS[key] ?? (key.length === 1 ? key.toUpperCase() : key),
    ariaName: key === " " ? "Space" : key
  };
}
