import { ControlProps, NEVER_DISABLED } from "@/core/ui/components/control";
import { computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const SwitchClass = {
  root: "fsg-Switch",
  thumb: "fsg-Switch-thumb"
} as const;

export type SwitchProps = ControlProps<boolean>;

export function Switch({ value, disabled = NEVER_DISABLED, onValueChange, size = "medium" }: SwitchProps): HTMLElement {
  return (
    <button
      className={SwitchClass.root}
      type="button"
      role="switch"
      aria-checked={computed(() => String(value.value))}
      disabled={disabled}
      dataset={{ size }}
      onClick={() => onValueChange(!value.peek())}
    >
      <span className={SwitchClass.thumb} />
    </button>
  );
}
