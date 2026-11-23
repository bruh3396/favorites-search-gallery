export const KEY_PRESS_MODIFIERS = [
  { label: "Ctrl", property: "ctrlKey" },
  { label: "Alt", property: "altKey" },
  { label: "Meta", property: "metaKey" }
] as const;

export function listHeldKeyPressModifiers(keyboardEvent: Pick<KeyboardEvent, "ctrlKey" | "altKey" | "metaKey">): string[] {
  return KEY_PRESS_MODIFIERS.filter(modifier => keyboardEvent[modifier.property]).map(modifier => modifier.label);
}
