import { FieldGuards } from "@/core/utils/guard/field_guards";
import { Guard } from "@/core/utils/guard/guard";
import { isRecord } from "@/core/utils/guard/unknown_utilities";

export function createFieldsGuard<T extends object>(fields: FieldGuards<T>): Guard<T> {
  const entries = Object.entries(fields as Record<string, Guard<unknown>>);
  return (raw): raw is T => isRecord(raw) && entries.every(([key, accepts]) => accepts(raw[key]));
}
