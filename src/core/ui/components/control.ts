import { Readable, Signal } from "@/core/utils/reactive/signal";

export const NEVER_DISABLED: Readable<boolean> = new Signal(false);

export type ControlSize = "medium" | "small";

export interface ControlChoice<T> {
  value: T;
  label: string;
}

export interface ControlProps<T> {
  value: Readable<T>;
  disabled?: Readable<boolean>;
  size?: ControlSize;
  onValueChange: (next: T) => void;
}
