import { Guard } from "@/core/utils/guard/guard";
import { isRecord } from "@/core/utils/guard/unknown_utilities";

export type FieldGuards<T extends object> = { [K in keyof T]: Guard<T[K]> };

export function createFieldsGuard<T extends object>(fields: FieldGuards<T>): Guard<T> {
  const entries = Object.entries(fields as Record<string, Guard<unknown>>);
  return (raw): raw is T => isRecord(raw) && entries.every(([key, accepts]) => accepts(raw[key]));
}
