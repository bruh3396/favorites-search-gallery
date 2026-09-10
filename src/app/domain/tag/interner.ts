import { copyString } from "@/utils/pure/string";

const internedStrings = new Map<string, string>();

export function internString(value: string): string {
  const existing = internedStrings.get(value);

  if (existing !== undefined) {
    return existing;
  }
  const flat = copyString(value);

  internedStrings.set(flat, flat);
  return flat;
}
