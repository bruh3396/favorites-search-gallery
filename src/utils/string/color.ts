import { randomElement } from "../collection/array";

const HEX_ALPHABET = "0123456789ABCDEF";

export function randomPurpleColor(): string {
  const c = (): string => randomElement(HEX_ALPHABET);
  return `${c}${c}00${c}${c}`;
}
