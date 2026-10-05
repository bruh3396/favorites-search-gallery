import { Control, ControlChoice, ControlOptions, NEVER_DISABLED } from "@/core/ui/components/control";
import { effect } from "@/core/utils/reactive/signal";

export const DropdownClass = {
  root: "fsg-Dropdown"
} as const;

export interface DropdownOptions<T> extends ControlOptions<T> {
  choices: readonly ControlChoice<T>[];
}

export interface Dropdown extends Control {
  readonly element: HTMLSelectElement;
}

export function createDropdown<T>(
  ownerDocument: Document,
  { choices, value, disabled = NEVER_DISABLED, onValueChange, size = "medium" }: DropdownOptions<T>
): Dropdown {
  const element = ownerDocument.createElement("select");
  const findSelectedIndex = (selected: T): number => choices.findIndex(choice => choice.value === selected);

  element.className = DropdownClass.root;
  element.dataset.size = size;
  element.append(...choices.map(({ label }, index) => createOption(ownerDocument, { label, index })));
  element.addEventListener("change", () => {
    const chosenIndex = element.selectedIndex;

    element.selectedIndex = findSelectedIndex(value.peek());
    onValueChange(choices[chosenIndex].value);
  });

  const disposeValue = effect(() => {
    element.selectedIndex = findSelectedIndex(value.value);
  });
  const disposeDisabled = effect(() => {
    element.disabled = disabled.value;
  });
  return {
    element,
    dispose: (): void => {
      disposeValue();
      disposeDisabled();
    }
  };
}

function createOption(ownerDocument: Document, { label, index }: { label: string; index: number }): HTMLOptionElement {
  const option = ownerDocument.createElement("option");

  option.value = String(index);
  option.textContent = label;
  return option;
}
