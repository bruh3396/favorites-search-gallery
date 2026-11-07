import { Readable } from "@/core/utils/reactive/signal";

export interface OptionMenuItem {
  readonly label: string;
  readonly selected: Readable<boolean>;
  readonly disabled?: Readable<boolean>;
  readonly startsGroup?: boolean;
  readonly keepsOpen?: boolean;
  onChoose: () => void;
}
