import { Guard } from "@/core/utils/guard/guard";
import { isOneOf } from "@/core/utils/guard/unknown_utilities";

export function createOneOfGuard<T>(members: readonly T[]): Guard<T> {
  return (raw): raw is T => isOneOf(members, raw);
}
