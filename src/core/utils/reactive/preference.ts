import { Readable } from "@/core/utils/reactive/signal";

export interface Preference<T> extends Readable<T> {
  set: (value: T) => void;
}
