import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { ControlProps } from "@/core/ui/components/control/control_props";
import { Signal, computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const MultiSelectClass = {
  root: "fsg-MultiSelect",
  option: "fsg-MultiSelect-option"
} as const;

export interface MultiSelectProps<T> extends ControlProps<readonly T[]> {
  choices: readonly ControlChoice<T>[];
}

export function MultiSelect<T>({ choices, value, disabled = new Signal(false), onValueChange, size = "medium" }: MultiSelectProps<T>): HTMLElement {
  const getPressedFlags = (values: readonly T[]): readonly boolean[] => choices.map(choice => values.includes(choice.value));
  const pressedFlags = computed(() => getPressedFlags(value.value));
  const toggle = (index: number): void => {
    const pressed = getPressedFlags(value.peek());

    if (isLastPressed(pressed, index)) {
      return;
    }
    onValueChange(choices.filter((_, other) => (other === index ? !pressed[other] : pressed[other])).map(choice => choice.value));
  };
  return (
    <div className={MultiSelectClass.root} role="group" dataset={{ size }}>
      {choices.map(({ label }, index) => (
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
