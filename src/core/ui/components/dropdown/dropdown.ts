import { Control, ControlOptions } from "@/core/ui/control";

export const DropdownClass = {
  root: "fsg-Dropdown"
} as const;

export type DropdownSize = "medium" | "small";

export interface DropdownOption<T> {
  value: T;
  label: string;
}

export interface DropdownOptions<T> extends ControlOptions<T> {
  options: readonly DropdownOption<T>[];
  size?: DropdownSize;
}

export interface Dropdown<T> extends Control<T> {
  readonly element: HTMLSelectElement;
}

export function createDropdown<T>(
  ownerDocument: Document,
  { options, onValueChange, size = "medium" }: DropdownOptions<T>
): Dropdown<T> {
  const element = ownerDocument.createElement("select");
  let selectedIndex = -1;

  element.className = DropdownClass.root;
  element.dataset.size = size;
  element.append(...options.map(({ label }, index) => createOption(ownerDocument, { label, index })));
  element.selectedIndex = selectedIndex;
  element.addEventListener("change", () => {
    const chosenIndex = element.selectedIndex;

    element.selectedIndex = selectedIndex;
    onValueChange(options[chosenIndex].value);
  });
  return {
    element,
    setValue: (value): void => {
      selectedIndex = options.findIndex(option => option.value === value);
      element.selectedIndex = selectedIndex;
    },
    setDisabled: (disabled): void => {
      element.disabled = disabled;
    }
  };
}

function createOption(ownerDocument: Document, { label, index }: { label: string; index: number }): HTMLOptionElement {
  const option = ownerDocument.createElement("option");

  option.value = String(index);
  option.textContent = label;
  return option;
}
