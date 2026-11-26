import { listHeldKeyPressModifiers } from "@/core/ui/key_bindings/key_press_modifier";

type KeyPress = Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "altKey" | "metaKey">;

const PHYSICAL_KEY_PATTERN = /^(?:Key|Digit)(?<character>[A-Z0-9])$/u;
const ALPHANUMERIC_KEY_PATTERN = /^[a-z0-9]$/iu;

export function normalizeKeyPress(keyPress: KeyPress): string {
  const key = readKey(keyPress);
  const baseKey = key.length === 1 ? key.toLowerCase() : key;
  return [...listHeldKeyPressModifiers(keyPress), baseKey].join("+");
}

function readKey({ key, code, altKey }: KeyPress): string {
  const character = PHYSICAL_KEY_PATTERN.exec(code)?.groups?.character;

  if (!altKey || ALPHANUMERIC_KEY_PATTERN.test(key) || character === undefined) {
    return key;
  }
  return character;
}
