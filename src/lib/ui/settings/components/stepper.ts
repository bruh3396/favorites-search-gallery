import { clamp, stepDown, stepUp } from "@/utils/number";
import { DebouncedStateBinding } from "@/lib/ui/settings/debounced_state_binding";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { StepperSetting } from "@/lib/ui/settings/setting";
import { bindEnableRule } from "../enable_rule";
import { controlRow } from "@/lib/ui/settings/components/row";
import { createElement } from "@/utils/dom/element_factory";
import { icon } from "@/lib/ui/icon";

const COMMIT_DEBOUNCE_MS = 50;

export function buildStepperRow(config: Partial<StepperSetting>): HTMLElement {
  const min = config.min ?? 0;
  const max = config.max ?? 100;
  const step = config.step ?? 1;
  const stepper = createElement("div", { id: config.id, className: SettingsClass.stepper });
  const decrement = stepperButton("minus");
  const increment = stepperButton("plus");
  const display = createElement("input", { className: SettingsClass.stepperValue });

  display.type = "text";
  display.inputMode = "numeric";

  const render = (value: number): void => {
    const clamped = clamp(value, min, max);

    display.value = String(clamped);
    decrement.disabled = clamped <= min;
    increment.disabled = clamped >= max;
  };

  const binding = new DebouncedStateBinding(config, min, render, COMMIT_DEBOUNCE_MS);

  const setValue = (next: number): void => {
    binding.set(clamp(next, min, max));
  };

  const commitInput = (): void => {
    const parsed = parseInt(display.value, 10);

    if (Number.isNaN(parsed)) {
      render(binding.value);
      return;
    }
    setValue(parsed);
    render(binding.value);
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
    setValue(stepDown(binding.value, step));
  });
  bindHold(increment, () => {
    setValue(stepUp(binding.value, step));
  });

  stepper.append(decrement, display, increment);

  const row = controlRow(config, stepper);

  if (config.id !== undefined) {
    row.id = `${config.id}-row`;
  }
  bindEnableRule(row, config.enabledWhen);
  return row;
}

function bindHold(button: HTMLButtonElement, step: () => void): void {
  const initialDelay = 350;
  const minInterval = 40;
  let timer = 0;
  let interval = 250;

  const stop = (): void => {
    window.clearTimeout(timer);
    interval = 250;
  };

  const repeat = (): void => {
    if (button.disabled) {
      stop();
      return;
    }
    step();
    interval = Math.max(minInterval, interval * 0.85);
    timer = window.setTimeout(repeat, interval);
  };

  button.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    step();
    timer = window.setTimeout(repeat, initialDelay);
  });

  button.addEventListener("pointerup", stop);
  button.addEventListener("pointerleave", stop);
  button.addEventListener("pointercancel", stop);
}

function stepperButton(iconName: "plus" | "minus"): HTMLButtonElement {
  const button = createElement("button", { className: SettingsClass.stepperButton, children: [icon(iconName)] });

  button.type = "button";
  return button;
}
