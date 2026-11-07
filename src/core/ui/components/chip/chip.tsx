import { Child, Reactive, h } from "@/core/ui/h/h";
import { Readable, computed } from "@/core/utils/reactive/signal";

export const ChipClass = {
  root: "fsg-Chip",
  label: "fsg-Chip-label"
} as const;

export interface ChipProps {
  label: string;
  value?: Reactive<string>;
  highlighted: Readable<boolean>;
  pressed?: Readable<boolean>;
  onClick?: () => void;
  children?: Child;
}

export function Chip({ label, value, highlighted, pressed, onClick, children }: ChipProps): HTMLElement {
  return (
    <button
      className={ChipClass.root}
      type="button"
      dataset={{ highlighted: computed(() => String(highlighted.value)) }}
      aria-pressed={pressed === undefined ? undefined : computed(() => String(pressed.value))}
      onClick={onClick}
    >
      {value === undefined ? label : <span className={ChipClass.label}>{label}</span>}
      {value}
      {children}
    </button>
  );
}
