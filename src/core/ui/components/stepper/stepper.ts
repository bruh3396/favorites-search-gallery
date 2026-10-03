import { Control, ControlOptions } from "@/core/ui/control";

export const StepperClass = {
  root: "fsg-Stepper",
  input: "fsg-Stepper-input",
  button: "fsg-Stepper-button"
} as const;

export type StepperSize = "medium" | "small";

export interface StepperScheduler {
  schedule: (task: () => void, delay: number) => () => void;
}

export interface StepperOptions extends ControlOptions<number> {
  label: string;
  min: number;
  max: number;
  step?: number;
  size?: StepperSize;
  scheduler: StepperScheduler;
}

export interface Stepper extends Control<number> {
  readonly element: HTMLDivElement;
}

const HOLD_DELAY = 400;
const REPEAT_INTERVAL = 60;
const OFFSET_PRECISION = 9;

const KEY_DIRECTIONS: Readonly<Record<string, 1 | -1>> = {
  ArrowUp: 1,
  ArrowDown: -1
};

export function createStepper(
  ownerDocument: Document,
  { label, min, max, step = 1, size = "medium", scheduler, onValueChange }: StepperOptions
): Stepper {
  const element = ownerDocument.createElement("div");
  const input = createInput(ownerDocument, { label, min, max, step });
  const decrement = createButton(ownerDocument, { label: "Decrease", text: "−" });
  const increment = createButton(ownerDocument, { label: "Increase", text: "+" });
  let current = min;
  let isDisabled = false;
  let cancelHold = (): void => undefined;

  const report = (next: number): void => {
    if (next !== current) {
      onValueChange(next);
    }
  };
  const stepBy = (direction: 1 | -1): void => report(stepFrom(current, { direction, min, max, step }));
  const show = (): void => {
    input.value = String(current);
    input.disabled = isDisabled;
    decrement.disabled = isDisabled || current <= min;
    increment.disabled = isDisabled || current >= max;
  };
  const stopHold = (): void => {
    cancelHold();
    cancelHold = (): void => undefined;
  };
  const hold = (button: HTMLButtonElement, direction: 1 | -1, delay: number): void => {
    cancelHold = scheduler.schedule(() => {
      if (button.disabled) {
        return;
      }
      stepBy(direction);
      hold(button, direction, REPEAT_INTERVAL);
    }, delay);
  };
  const bindButton = (button: HTMLButtonElement, direction: 1 | -1): void => {
    // Pointer events still reach a disabled button, unlike click.
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || button.disabled) {
        return;
      }
      event.preventDefault();
      stopHold();
      stepBy(direction);
      hold(button, direction, HOLD_DELAY);
    });
    button.addEventListener("click", (event) => {
      if (event.detail === 0) {
        stepBy(direction);
      }
    });

    for (const type of ["pointerup", "pointerleave", "pointercancel"]) {
      button.addEventListener(type, stopHold);
    }
  };

  element.className = StepperClass.root;
  element.dataset.size = size;
  element.append(decrement, input, increment);
  bindButton(decrement, -1);
  bindButton(increment, 1);
  input.addEventListener("keydown", (event) => {
    const direction = KEY_DIRECTIONS[event.key];

    if (direction !== undefined) {
      event.preventDefault();
      stepBy(direction);
    }
  });
  input.addEventListener("change", () => {
    const typed = input.valueAsNumber;

    show();

    if (!Number.isNaN(typed)) {
      report(Math.min(max, Math.max(min, typed)));
    }
  });

  show();
  return {
    element,
    setValue: (value): void => {
      current = value;
      show();
    },
    setDisabled: (disabled): void => {
      isDisabled = disabled;
      stopHold();
      show();
    }
  };
}

function stepFrom(
  value: number,
  { direction, min, max, step }: { direction: 1 | -1; min: number; max: number; step: number }
): number {
  const offset = roundToPrecision((value - min) / step, OFFSET_PRECISION);
  const index = direction === 1 ? Math.floor(offset) + 1 : Math.ceil(offset) - 1;
  const next = roundToPrecision(min + index * step, decimalsOf(step));
  return Math.min(max, Math.max(min, next));
}

// Division by a decimal step leaves noise (0.6 / 0.1 is 5.999…), which would floor to the step already on.
function roundToPrecision(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

function decimalsOf(step: number): number {
  return String(step).split(".")[1]?.length ?? 0;
}

function createInput(
  ownerDocument: Document,
  { label, min, max, step }: { label: string; min: number; max: number; step: number }
): HTMLInputElement {
  const input = ownerDocument.createElement("input");

  input.className = StepperClass.input;
  input.type = "number";
  input.setAttribute("aria-label", label);
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  return input;
}

function createButton(ownerDocument: Document, { label, text }: { label: string; text: string }): HTMLButtonElement {
  const button = ownerDocument.createElement("button");

  button.className = StepperClass.button;
  button.type = "button";
  button.tabIndex = -1;
  button.textContent = text;
  button.setAttribute("aria-label", label);
  return button;
}
