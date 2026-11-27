import { Icon } from "@/core/ui/components/icon/icon";

export interface ContextMenuItem {
  readonly label: string;
  readonly icon?: Icon;
  readonly shortcut?: string;
  readonly checked?: boolean;
  readonly disabled?: boolean;
  readonly startsGroup?: boolean;
  onChoose: () => void;
}
