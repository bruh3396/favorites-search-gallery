import { Signal, computed } from "@/core/utils/reactive/signal";
import { ControlProps } from "@/core/ui/components/control/control_props";
import { h } from "@/core/ui/h/h";

export const SwitchClass = {
  root: "fsg-Switch",
  thumb: "fsg-Switch-thumb"
} as const;

export type SwitchProps = ControlProps<boolean>;

export function Switch({ value, disabled = new Signal(false), onValueChange, size: controlSize = "medium" }: SwitchProps): HTMLElement {
  return (
    <button
      className={SwitchClass.root}
      type="button"
      role="switch"
      aria-checked={computed(() => String(value.value))}
      disabled={disabled}
      dataset={{ size: controlSize }}
      onClick={() => onValueChange(!value.peek())}
    >
      <span className={SwitchClass.thumb} />
    </button>
  );
}
