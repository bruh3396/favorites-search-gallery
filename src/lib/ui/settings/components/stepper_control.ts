import { clamp, roundDownToMultiple, roundUpToMultiple } from "@/utils/pure/number";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";

const HOLD_INITIAL_DELAY_MS = 120;
const HOLD_START_INTERVAL_MS = 140;
const HOLD_MIN_INTERVAL_MS = 20;
const HOLD_DECAY = 0.75;

interface StepperConfig {
  id?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

export interface Stepper {
  element: HTMLElement;
  value: number;
  setValue: (next: number) => void;
  setMax: (next: number) => void;
}

export function buildStepper(config: StepperConfig): Stepper {
  const { min, step } = config;
  let max = config.max;
  const element = createElement("div", { id: config.id, className: SettingsClass.stepper });
  const decrement = stepperButton("minus");
  const increment = stepperButton("plus");
  const display = createElement("input", { className: SettingsClass.stepperValue });

  display.type = "text";
  display.inputMode = "numeric";
  let current = clamp(config.value, min, max);

  const render = (): void => {
    display.value = String(current);
    decrement.disabled = current <= min;
    increment.disabled = current >= max;
  };

  const update = (next: number): void => {
    const clamped = clamp(next, min, max);

    if (clamped === current) {
      return;
    }
    current = clamped;
    render();
    config.onChange(current);
  };

  const commitInput = (): void => {
    const parsed = parseInt(display.value, 10);

    if (Number.isNaN(parsed)) {
      render();
      return;
    }
    update(parsed);
    render();
  };

  display.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  display.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      display.blur();
    }
  });
  display.addEventListener("blur", commitInput);

  bindHold(decrement, () => {
    update(roundDownToMultiple(current, step));
  });
  bindHold(increment, () => {
    update(roundUpToMultiple(current, step));
  });

  element.append(decrement, display, increment);
  render();
  return {
    element,
    get value(): number {
      return current;
    },
    setValue: (next: number): void => {
      current = clamp(next, min, max);
      render();
    },
    setMax: (next: number): void => {
      max = next;
      current = clamp(current, min, max);
      render();
    }
  };
}

function bindHold(button: HTMLButtonElement, step: () => void): void {
  let timer = 0;
  let interval = HOLD_START_INTERVAL_MS;

  const stop = (): void => {
    window.clearTimeout(timer);
    interval = HOLD_START_INTERVAL_MS;
  };

  const repeat = (): void => {
    if (button.disabled) {
      stop();
      return;
    }
    step();
    interval = Math.max(HOLD_MIN_INTERVAL_MS, interval * HOLD_DECAY);
    timer = window.setTimeout(repeat, interval);
  };

  button.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    step();
    timer = window.setTimeout(repeat, HOLD_INITIAL_DELAY_MS);
  });

  button.addEventListener("pointerup", stop);
  button.addEventListener("pointerleave", stop);
  button.addEventListener("pointercancel", stop);
}

function stepperButton(iconName: "plus" | "minus"): HTMLButtonElement {
  const button = createElement("button", { className: SettingsClass.stepperButton, children: [icon(iconName)] });

  button.type = "button";
  button.dataset.step = iconName;
  return button;
}
