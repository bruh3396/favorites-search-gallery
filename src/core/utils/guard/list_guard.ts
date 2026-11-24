import { Guard } from "@/core/utils/guard/guard";

export function createListGuard<T>(accepts: Guard<T>): Guard<readonly T[]> {
  return (raw): raw is readonly T[] => Array.isArray(raw) && raw.every(accepts);
}
