import { ControlProps, NEVER_DISABLED } from "@/core/ui/components/control";
import { computed } from "@/core/utils/reactive/signal";
import { doNothing } from "@/core/utils/function/function";
import { h } from "@/core/ui/h/h";

export const SliderClass = {
  root: "fsg-Slider",
  input: "fsg-Slider-input"
} as const;

export interface SliderProps extends ControlProps<number> {
  label: string;
  min: number;
  max: number;
  step?: number;
  onValueCommit?: (value: number) => void;
}

export function Slider({
  label,
  min,
  max,
  step = 1,
  size = "medium",
  value,
  disabled = NEVER_DISABLED,
  onValueChange,
  onValueCommit = doNothing
}: SliderProps): HTMLElement {
  return (
    <div className={SliderClass.root} dataset={{ size }}>
      <input
        className={SliderClass.input}
        type="range"
        min={String(min)}
        max={String(max)}
        step={String(step)}
        aria-label={label}
        value={computed(() => String(value.value))}
        disabled={disabled}
        onInput={event => {
          if (event.currentTarget.valueAsNumber !== value.peek()) {
            onValueChange(event.currentTarget.valueAsNumber);
          }
        }}
        onChange={event => onValueCommit(event.currentTarget.valueAsNumber)}
      />
    </div>
  );
}
