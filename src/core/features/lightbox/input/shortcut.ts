import { LightboxCommand } from "@/core/features/lightbox/input/commands";
import { LightboxKeymap } from "@/core/features/lightbox/input/key_listener";

export interface LightboxShortcut {
  readonly text: string;
  readonly ariaName: string;
}

const TEXTS: Readonly<Record<string, string>> = { " ": "Space", ArrowLeft: "←", ArrowRight: "→", Escape: "Esc" };

export function findLightboxShortcut(keymap: LightboxKeymap, command: LightboxCommand): LightboxShortcut | undefined {
  const key = Object.keys(keymap).find(candidate => keymap[candidate] === command);

  if (key === undefined) {
    return undefined;
  }
  return {
    text: TEXTS[key] ?? (key.length === 1 ? key.toUpperCase() : key),
    ariaName: key === " " ? "Space" : key
  };
}
