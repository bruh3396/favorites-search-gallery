import { Control, ControlChoice, ControlOptions, NEVER_DISABLED } from "@/core/ui/components/control";
import { effect } from "@/core/utils/reactive/signal";

export const SegmentedClass = {
  root: "fsg-Segmented",
  option: "fsg-Segmented-option"
} as const;

export interface SegmentedOptions<T> extends ControlOptions<T> {
  choices: readonly ControlChoice<T>[];
}

export interface Segmented extends Control {
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

export function createSegmented<T>(
  ownerDocument: Document,
  { choices, value, disabled = NEVER_DISABLED, onValueChange, size = "medium" }: SegmentedOptions<T>
): Segmented {
  const element = ownerDocument.createElement("div");
  const buttons = choices.map(({ label }) => createChoiceButton(ownerDocument, label));
  const findCheckedIndex = (checked: T): number => choices.findIndex(choice => choice.value === checked);
  const select = (index: number): void => {
    if (index !== findCheckedIndex(value.peek())) {
      onValueChange(choices[index].value);
    }
  };

  element.className = SegmentedClass.root;
  element.dataset.size = size;
  element.setAttribute("role", "radiogroup");
  element.append(...buttons);
  buttons.forEach((button, index) => button.addEventListener("click", () => select(index)));
  element.addEventListener("keydown", event => {
    const step = KEY_STEPS[event.key];
    const from = buttons.indexOf(event.target as HTMLButtonElement);

    if (step === undefined || from === -1) {
      return;
    }
    event.preventDefault();
    const to = step(from, buttons.length);

    buttons[to].focus();
    select(to);
  });

  const disposeValue = effect(() => showChecked(buttons, findCheckedIndex(value.value)));
  const disposeDisabled = effect(() => {
    const isDisabled = disabled.value;

    for (const button of buttons) {
      button.disabled = isDisabled;
    }
  });
  return {
    element,
    dispose: (): void => {
      disposeValue();
      disposeDisabled();
    }
  };
}

// Roving tabindex: only the checked choice is a tab stop, or the first one while none is checked.
function showChecked(buttons: readonly HTMLButtonElement[], checkedIndex: number): void {
  const tabStop = Math.max(checkedIndex, 0);

  buttons.forEach((button, index) => {
    button.setAttribute("aria-checked", String(index === checkedIndex));
    button.tabIndex = index === tabStop ? 0 : -1;
  });
}

function createChoiceButton(ownerDocument: Document, label: string): HTMLButtonElement {
  const button = ownerDocument.createElement("button");

  button.className = SegmentedClass.option;
  button.type = "button";
  button.textContent = label;
  button.setAttribute("role", "radio");
  return button;
}
