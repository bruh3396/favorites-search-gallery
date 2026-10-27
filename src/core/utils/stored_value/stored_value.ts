import { Occurrence } from "@/core/utils/reactive/occurrence";
import { Readable } from "@/core/utils/reactive/signal";

export interface StoredValue<T> extends Readable<T> {
  set: (value: T) => void;
  readonly changed: Occurrence<T>;
}
