import { Icon } from "@/core/ui/components/icon/icon";

export interface ControlChoice<T> {
  readonly value: T;
  readonly label: string;
  readonly icon?: Icon;
}
