import { Control, ControlOptions, NEVER_DISABLED } from "@/core/ui/components/control";
import { StepGesture } from "@/core/ui/components/stepper/step_gesture";
import { effect } from "@/core/utils/reactive/signal";

export const StepperClass = {
  root: "fsg-Stepper",
  input: "fsg-Stepper-input",
  button: "fsg-Stepper-button"
} as const;

export interface StepperScheduler {
  schedule: (task: () => void, delay: number) => () => void;
}

export interface StepperOptions extends ControlOptions<number> {
  label: string;
  min: number;
  max: number;
  step?: number;
  scheduler: StepperScheduler;
  onValueCommit?: (value: number) => void;
}

export interface Stepper extends Control {
  readonly element: HTMLDivElement;
}

const OFFSET_PRECISION = 9;

const KEY_DIRECTIONS: Readonly<Record<string, 1 | -1>> = {
  ArrowUp: 1,
  ArrowDown: -1
};

export function createStepper(
  ownerDocument: Document,
  {
    label, min, max, step = 1, size = "medium", scheduler, value, disabled = NEVER_DISABLED, onValueChange, onValueCommit = (): void => undefined
  }: StepperOptions
): Stepper {
  const element = ownerDocument.createElement("div");
  const input = createInput(ownerDocument, { label, min, max, step });
  const decrement = createButton(ownerDocument, { label: "Decrease", text: "−" });
  const increment = createButton(ownerDocument, { label: "Increase", text: "+" });
  const gesture = new StepGesture({
    schedule: (task, delay): (() => void) => scheduler.schedule(task, delay),
    getValue: (): number => value.peek(),
    commit: onValueCommit
  });
  const reportIfChanged = (next: number): void => {
    if (next !== value.peek()) {
      onValueChange(next);
    }
  };
  const stepBy = (direction: 1 | -1): void => reportIfChanged(stepFrom(value.peek(), { direction, min, max, step }));
  const showState = ({ current, isDisabled }: { current: number; isDisabled: boolean }): void => {
    input.value = String(current);
    input.disabled = isDisabled;
    decrement.disabled = isDisabled || current <= min;
    increment.disabled = isDisabled || current >= max;
  };
  const stepIfEnabled = (button: HTMLButtonElement, direction: 1 | -1): boolean => {
    if (button.disabled) {
      return false;
    }
    stepBy(direction);
    return true;
  };
  const finishGesture = (): void => gesture.finish();
  const bindButton = (button: HTMLButtonElement, direction: 1 | -1): void => {
    button.addEventListener("pointerdown", event => {
      if (event.button !== 0 || button.disabled) {
        return;
      }
      event.preventDefault();
      gesture.finish();
      gesture.begin();
      stepBy(direction);
      gesture.repeat(() => stepIfEnabled(button, direction));
    });
    button.addEventListener("click", event => {
      if (event.detail === 0) {
        gesture.begin();
        stepBy(direction);
        gesture.finish();
      }
    });

    for (const type of ["pointerup", "pointerleave", "pointercancel"]) {
      button.addEventListener(type, finishGesture);
    }
  };

  element.className = StepperClass.root;
  element.dataset.size = size;
  element.append(decrement, input, increment);
  bindButton(decrement, -1);
  bindButton(increment, 1);
  input.addEventListener("keydown", event => {
    const direction = KEY_DIRECTIONS[event.key];

    if (direction !== undefined) {
      event.preventDefault();
      gesture.begin();
      stepBy(direction);
    }
  });
  input.addEventListener("keyup", event => {
    if (KEY_DIRECTIONS[event.key] !== undefined) {
      gesture.finish();
    }
  });
  input.addEventListener("blur", finishGesture);
  input.addEventListener("change", () => {
    const typed = input.valueAsNumber;

    showState({ current: value.peek(), isDisabled: disabled.peek() });

    if (!Number.isNaN(typed)) {
      gesture.begin();
      reportIfChanged(Math.min(max, Math.max(min, typed)));
      gesture.finish();
    }
  });

  const disposeValue = effect(() => showState({ current: value.value, isDisabled: disabled.value }));
  const disposeGestureEnd = effect(() => {
    if (disabled.value) {
      gesture.finish();
    }
  });
  return {
    element,
    dispose: (): void => {
      disposeValue();
      disposeGestureEnd();
    }
  };
}

function stepFrom(
  value: number,
  { direction, min, max, step }: { direction: 1 | -1; min: number; max: number; step: number }
): number {
  const offset = roundToPrecision((value - min) / step, OFFSET_PRECISION);
  const index = direction === 1 ? Math.floor(offset) + 1 : Math.ceil(offset) - 1;
  const next = roundToPrecision(min + (index * step), countDecimals(step));
  return Math.min(max, Math.max(min, next));
}

function roundToPrecision(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

function countDecimals(step: number): number {
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
