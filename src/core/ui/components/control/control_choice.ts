import { Icon } from "@/core/ui/components/icon/icon";

export interface ControlChoice<Value> {
  readonly value: Value;
  readonly label: string;
  readonly icon?: Icon;
}
