import { ControlChoice, ControlProps, NEVER_DISABLED } from "@/core/ui/components/control";
import { effect } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const DropdownClass = {
  root: "fsg-Dropdown"
} as const;

export interface DropdownProps<T> extends ControlProps<T> {
  choices: readonly ControlChoice<T>[];
}

export function Dropdown<T>({ choices, value, disabled = NEVER_DISABLED, onValueChange, size = "medium" }: DropdownProps<T>): HTMLElement {
  const findSelectedIndex = (selected: T): number => choices.findIndex(choice => choice.value === selected);
  const element = (
    <select
      className={DropdownClass.root}
      dataset={{ size }}
      disabled={disabled}
      onChange={event => {
        const chosenIndex = event.currentTarget.selectedIndex;

        event.currentTarget.selectedIndex = findSelectedIndex(value.peek());
        onValueChange(choices[chosenIndex].value);
      }}
    >
      {choices.map(({ label }, index) => <option value={String(index)}>{label}</option>)}
    </select>
  ) as HTMLSelectElement;

  effect(() => {
    element.selectedIndex = findSelectedIndex(value.value);
  });
  return element;
}
