import { ControlSize } from "@/core/ui/components/control/control_size";
import { Readable } from "@/core/utils/reactive/signal";

export interface ControlProps<T> {
  value: Readable<T>;
  disabled?: Readable<boolean>;
  size?: ControlSize;
  onValueChange: (next: T) => void;
}
