export interface ContextMenuItem {
  readonly label: string;
  readonly disabled?: boolean;
  readonly startsGroup?: boolean;
  onChoose: () => void;
}
