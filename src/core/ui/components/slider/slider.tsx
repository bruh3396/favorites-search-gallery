import { Signal, computed, effect } from "@/core/utils/reactive/signal";
import { ControlProps } from "@/core/ui/components/control/control_props";
import { doNothing } from "@/core/utils/function/function_utilities";
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
  size: controlSize = "medium",
  value,
  disabled = new Signal(false),
  onValueChange,
  onValueCommit = doNothing
}: SliderProps): HTMLElement {
  const root = (
    <div className={SliderClass.root} dataset={{ size: controlSize }}>
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

  effect(() => root.style.setProperty("--fsg-Slider-fraction", String((value.value - min) / (max - min))));
  return root;
}
