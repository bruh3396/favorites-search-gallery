import { ControlSize } from "@/core/ui/components/control/control_size";
import { Readable } from "@/core/utils/reactive/signal";

export interface ControlProps<Value> {
  value: Readable<Value>;
  disabled?: Readable<boolean>;
  size?: ControlSize;
  onValueChange: (value: Value) => void;
}
