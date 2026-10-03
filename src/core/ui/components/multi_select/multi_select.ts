import { Control, ControlOptions } from "@/core/ui/control";

export const MultiSelectClass = {
  root: "fsg-MultiSelect",
  option: "fsg-MultiSelect-option"
} as const;

export type MultiSelectSize = "medium" | "small";

export interface MultiSelectOption<T> {
  value: T;
  label: string;
}

export interface MultiSelectOptions<T> extends ControlOptions<readonly T[]> {
  options: readonly MultiSelectOption<T>[];
  size?: MultiSelectSize;
}

export interface MultiSelect<T> extends Control<readonly T[]> {
  readonly element: HTMLDivElement;
}

// WAI-ARIA APG toggle buttons in a group: each is its own tab stop. At least one stays pressed, so the last one
// pressed can't be released; it stays focusable and says why through aria-disabled rather than native disabled.
export function createMultiSelect<T>(ownerDocument: Document, { options, onValueChange, size = "medium" }: MultiSelectOptions<T>): MultiSelect<T> {
  const element = ownerDocument.createElement("div");
  const buttons = options.map(({ label }) => createOptionButton(ownerDocument, label));
  let pressed: readonly boolean[] = options.map(() => false);
  const toggle = (index: number): void => {
    if (isLastPressed(pressed, index)) {
      return;
    }
    onValueChange(options.filter((_, other) => (other === index ? !pressed[other] : pressed[other])).map((option) => option.value));
  };

  element.className = MultiSelectClass.root;
  element.dataset.size = size;
  element.setAttribute("role", "group");
  element.append(...buttons);
  buttons.forEach((button, index) => button.addEventListener("click", () => toggle(index)));
  showPressed(buttons, pressed);
  return {
    element,
    setValue: (values): void => {
      pressed = options.map((option) => values.includes(option.value));
      showPressed(buttons, pressed);
    },
    setDisabled: (disabled): void => {
      for (const button of buttons) {
        button.disabled = disabled;
      }
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

function createOptionButton(ownerDocument: Document, label: string): HTMLButtonElement {
  const button = ownerDocument.createElement("button");

  button.className = MultiSelectClass.option;
  button.type = "button";
  button.textContent = label;
  return button;
}
