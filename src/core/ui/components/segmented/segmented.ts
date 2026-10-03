import { Control, ControlOptions } from "@/core/ui/control";

export const SegmentedClass = {
  root: "fsg-Segmented",
  option: "fsg-Segmented-option"
} as const;

export type SegmentedSize = "medium" | "small";

export interface SegmentedOption<T> {
  value: T;
  label: string;
}

export interface SegmentedOptions<T> extends ControlOptions<T> {
  options: readonly SegmentedOption<T>[];
  size?: SegmentedSize;
}

export interface Segmented<T> extends Control<T> {
  readonly element: HTMLDivElement;
}

// WAI-ARIA APG radio group: arrows move and select, wrapping at the ends; Home and End jump to the ends.
const KEY_STEPS: Readonly<Record<string, (index: number, count: number) => number>> = {
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  ArrowUp: (index, count) => (index - 1 + count) % count,
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowDown: (index, count) => (index + 1) % count,
  Home: () => 0,
  End: (_, count) => count - 1
};

export function createSegmented<T>(ownerDocument: Document, { options, onValueChange, size = "medium" }: SegmentedOptions<T>): Segmented<T> {
  const element = ownerDocument.createElement("div");
  const buttons = options.map(({ label }) => createOptionButton(ownerDocument, label));
  let checkedIndex = -1;
  const report = (index: number): void => {
    if (index !== checkedIndex) {
      onValueChange(options[index].value);
    }
  };

  element.className = SegmentedClass.root;
  element.dataset.size = size;
  element.setAttribute("role", "radiogroup");
  element.append(...buttons);
  buttons.forEach((button, index) => button.addEventListener("click", () => report(index)));
  element.addEventListener("keydown", (event) => {
    const step = KEY_STEPS[event.key];
    const from = buttons.indexOf(event.target as HTMLButtonElement);

    if (step === undefined || from === -1) {
      return;
    }
    event.preventDefault();
    const to = step(from, buttons.length);

    buttons[to].focus();
    report(to);
  });

  showChecked(buttons, checkedIndex);
  return {
    element,
    setValue: (value): void => {
      checkedIndex = options.findIndex((option) => option.value === value);
      showChecked(buttons, checkedIndex);
    },
    setDisabled: (disabled): void => {
      for (const button of buttons) {
        button.disabled = disabled;
      }
    }
  };
}

// Roving tabindex: only the checked option is a tab stop, or the first one while none is checked.
function showChecked(buttons: readonly HTMLButtonElement[], checkedIndex: number): void {
  const tabStop = Math.max(checkedIndex, 0);

  buttons.forEach((button, index) => {
    button.setAttribute("aria-checked", String(index === checkedIndex));
    button.tabIndex = index === tabStop ? 0 : -1;
  });
}

function createOptionButton(ownerDocument: Document, label: string): HTMLButtonElement {
  const button = ownerDocument.createElement("button");

  button.className = SegmentedClass.option;
  button.type = "button";
  button.textContent = label;
  button.setAttribute("role", "radio");
  return button;
}
