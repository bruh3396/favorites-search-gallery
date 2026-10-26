import { Readable } from "@/core/utils/reactive/signal";

export interface SettingPreference<T> extends Readable<T> {
  set(value: T): void;
}
