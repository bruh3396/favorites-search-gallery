import { Guard } from "@/core/utils/guard/guard";

export type FieldGuards<T extends object> = { [K in keyof T]: Guard<T[K]> };
