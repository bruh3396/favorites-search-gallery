import { Guard } from "@/core/utils/guard/guard";

export function createSameKindGuard<T>(example: T): Guard<T> {
  return (raw): raw is T => getKind(raw) === getKind(example);
}

function getKind(value: unknown): string {
  if (value === null) {
    return "null";
  }
  return Array.isArray(value) ? "array" : typeof value;
}
