export const KEY_PRESS_MODIFIERS = [
  { label: "Ctrl", property: "ctrlKey" },
  { label: "Alt", property: "altKey" },
  { label: "Meta", property: "metaKey" }
] as const;

export type KeyPressModifier = (typeof KEY_PRESS_MODIFIERS)[number];

export function listHeldKeyPressModifiers(keyboardEvent: Pick<KeyboardEvent, KeyPressModifier["property"]>): KeyPressModifier["label"][] {
  return KEY_PRESS_MODIFIERS.filter(modifier => keyboardEvent[modifier.property]).map(modifier => modifier.label);
}
