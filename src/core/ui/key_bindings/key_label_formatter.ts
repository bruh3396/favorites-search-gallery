import { KEY_PRESS_MODIFIERS } from "@/core/ui/key_bindings/key_press_modifier";

const KEY_LABELS: Readonly<Record<string, string>> = {
  " ": "Space",
  ArrowRight: "→",
  ArrowLeft: "←",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Escape: "Esc",
  Backspace: "Bksp",
  Delete: "Del"
};

const MODIFIER_PREFIXES = KEY_PRESS_MODIFIERS.map(modifier => `${modifier.label}+`);

export function formatKeyLabel(key: string): string {
  const modifierPrefix = MODIFIER_PREFIXES.find(prefix => key.startsWith(prefix) && key.length > prefix.length);

  if (modifierPrefix !== undefined) {
    return `${modifierPrefix}${formatKeyLabel(key.slice(modifierPrefix.length))}`;
  }
  return KEY_LABELS[key] ?? (key.length === 1 ? key.toUpperCase() : key);
}
