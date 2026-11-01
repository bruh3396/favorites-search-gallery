import { Signal, computed } from "@/core/utils/reactive/signal";
import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { ControlProps } from "@/core/ui/components/control/control_props";
import { h } from "@/core/ui/h/h";

export const MultiSelectClass = {
  root: "fsg-MultiSelect",
  option: "fsg-MultiSelect-option"
} as const;

export interface MultiSelectProps<Value> extends ControlProps<readonly Value[]> {
  controlChoices: readonly ControlChoice<Value>[];
}

export function MultiSelect<Value>({
  controlChoices, value, disabled = new Signal(false), onValueChange, size: controlSize = "medium"
}: MultiSelectProps<Value>): HTMLElement {
  const getPressedFlags = (values: readonly Value[]): readonly boolean[] => controlChoices.map(controlChoice => values.includes(controlChoice.value));
  const pressedFlags = computed(() => getPressedFlags(value.value));
  const toggle = (index: number): void => {
    const pressed = getPressedFlags(value.peek());

    if (isLastPressed(pressed, index)) {
      return;
    }
    onValueChange(controlChoices.filter((_, other) => (other === index ? !pressed[other] : pressed[other])).map(controlChoice => controlChoice.value));
  };
  return (
    <div className={MultiSelectClass.root} role="group" dataset={{ size: controlSize }}>
      {controlChoices.map(({ label }, index) => (
        <button
          className={MultiSelectClass.option}
          type="button"
          aria-pressed={computed(() => String(pressedFlags.value[index]))}
          aria-disabled={computed(() => (isLastPressed(pressedFlags.value, index) ? "true" : null))}
          disabled={disabled}
          onClick={() => toggle(index)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function isLastPressed(pressed: readonly boolean[], index: number): boolean {
  return pressed[index] && pressed.filter(Boolean).length === 1;
}
