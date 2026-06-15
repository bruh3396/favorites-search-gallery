import { bindEnableRule, commit, currentValue, onPreferenceChange, toBinding } from "@/lib/ui/settings/state_binding";
import { clamp, stepDown, stepUp } from "@/utils/number";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { StepperSetting } from "@/lib/ui/settings/setting";
import { controlRow } from "@/lib/ui/settings/components/row";
import { createElement } from "@/utils/dom/element_factory";
import { debounceTrailing } from "@/lib/async/debounce";
import { icon } from "@/lib/ui/icon";

const COMMIT_DEBOUNCE_MS = 50;

export function buildStepperRow(config: Partial<StepperSetting>): HTMLElement {
  const min = config.min ?? 0;
  const max = config.max ?? 100;
  const step = config.step ?? 1;
  const binding = toBinding(config, min);
  let value = clamp(currentValue(binding), min, max);

  const stepper = createElement("div", { id: config.id, className: SettingsClass.stepper });
  const decrement = stepperButton("minus");
  const increment = stepperButton("plus");
  const display = createElement("input", { className: SettingsClass.stepperValue });

  display.type = "text";
  display.inputMode = "numeric";

  const pushValue = debounceTrailing((next: number): void => {
    commit(binding, next);
  }, COMMIT_DEBOUNCE_MS);

  const render = (): void => {
    display.value = String(value);
    decrement.disabled = value <= min;
    increment.disabled = value >= max;
  };

  const setValue = (next: number): void => {
    const clamped = clamp(next, min, max);

    if (clamped === value) {
      return;
    }
    value = clamped;
    render();
    pushValue(value);
  };

  const commitInput = (): void => {
    const parsed = parseInt(display.value, 10);

    if (Number.isNaN(parsed)) {
      render();
      return;
    }
    setValue(parsed);
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
    setValue(stepDown(value, step));
  });
  bindHold(increment, () => {
    setValue(stepUp(value, step));
  });

  onPreferenceChange(binding, (next) => {
    if (next === value) {
      return;
    }
    value = clamp(next, min, max);
    render();
  });

  stepper.append(decrement, display, increment);
  render();

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
