import { Readable, Signal } from "@/core/utils/reactive/signal";
import { Icon } from "@/core/ui/components/icon/icon";

export const NEVER_DISABLED: Readable<boolean> = new Signal(false);

export type ControlSize = "medium" | "small";

export interface ControlChoice<T> {
  readonly value: T;
  readonly label: string;
  readonly icon?: Icon;
}

export interface ControlProps<T> {
  value: Readable<T>;
  disabled?: Readable<boolean>;
  size?: ControlSize;
  onValueChange: (next: T) => void;
}
