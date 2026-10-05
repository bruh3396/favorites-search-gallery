import { Control, ControlChoice, ControlOptions, NEVER_DISABLED } from "@/core/ui/components/control";
import { effect } from "@/core/utils/reactive/signal";

export const MultiSelectClass = {
  root: "fsg-MultiSelect",
  option: "fsg-MultiSelect-option"
} as const;

export interface MultiSelectOptions<T> extends ControlOptions<readonly T[]> {
  choices: readonly ControlChoice<T>[];
}

export interface MultiSelect extends Control {
  readonly element: HTMLDivElement;
}

// WAI-ARIA APG toggle buttons in a group: each is its own tab stop. At least one stays pressed, so the last one
// pressed can't be released; it stays focusable and says why through aria-disabled rather than native disabled.
export function createMultiSelect<T>(
  ownerDocument: Document,
  { choices, value, disabled = NEVER_DISABLED, onValueChange, size = "medium" }: MultiSelectOptions<T>
): MultiSelect {
  const element = ownerDocument.createElement("div");
  const buttons = choices.map(({ label }) => createChoiceButton(ownerDocument, label));
  const getPressedFlags = (values: readonly T[]): readonly boolean[] => choices.map(choice => values.includes(choice.value));
  const toggle = (index: number): void => {
    const pressed = getPressedFlags(value.peek());

    if (isLastPressed(pressed, index)) {
      return;
    }
    onValueChange(choices.filter((_, other) => (other === index ? !pressed[other] : pressed[other])).map(choice => choice.value));
  };

  element.className = MultiSelectClass.root;
  element.dataset.size = size;
  element.setAttribute("role", "group");
  element.append(...buttons);
  buttons.forEach((button, index) => button.addEventListener("click", () => toggle(index)));

  const disposeValue = effect(() => showPressed(buttons, getPressedFlags(value.value)));
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

function isLastPressed(pressed: readonly boolean[], index: number): boolean {
  return pressed[index] && pressed.filter(Boolean).length === 1;
}

function showPressed(buttons: readonly HTMLButtonElement[], pressed: readonly boolean[]): void {
  buttons.forEach((button, index) => {
    button.setAttribute("aria-pressed", String(pressed[index]));

    if (isLastPressed(pressed, index)) {
      button.setAttribute("aria-disabled", "true");
    } else {
      button.removeAttribute("aria-disabled");
    }
  });
}

function createChoiceButton(ownerDocument: Document, label: string): HTMLButtonElement {
  const button = ownerDocument.createElement("button");

  button.className = MultiSelectClass.option;
  button.type = "button";
  button.textContent = label;
  return button;
}
