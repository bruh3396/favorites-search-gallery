import { listHeldKeyPressModifiers } from "@/core/ui/key_bindings/key_press_modifier";

export type KeyPress = Pick<KeyboardEvent, "key" | "ctrlKey" | "altKey" | "metaKey">;

export function normalizeKeyPress(keyPress: KeyPress): string {
  const { key } = keyPress;
  const baseKey = key.length === 1 ? key.toLowerCase() : key;
  return [...listHeldKeyPressModifiers(keyPress), baseKey].join("+");
}
