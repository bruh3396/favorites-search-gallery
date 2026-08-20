import { DebouncedStateBinding } from "@/lib/ui/settings/debounced_state_binding";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SliderSetting } from "@/lib/ui/settings/setting";
import { bindEnableRule } from "@/lib/ui/settings/enable_rule";
import { clamp } from "@/utils/pure/number";
import { controlRow } from "@/lib/ui/settings/components/row";
import { createElement } from "@/utils/browser/factory";

const COMMIT_DEBOUNCE_MS = 50;

export function buildSliderRow(config: Partial<SliderSetting>): HTMLElement {
  const min = config.min ?? 0;
  const max = config.max ?? 1;
  const step = config.step ?? 0.01;
  const slider = createElement("div", { id: config.id, className: SettingsClass.slider });
  const input = createElement("input", { className: SettingsClass.sliderInput });
  const display = createElement("span", { className: SettingsClass.sliderValue });

  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);

  const render = (value: number): void => {
    const clamped = clamp(value, min, max);

    input.value = String(clamped);
    display.textContent = String(clamped);
  };

  const binding = new DebouncedStateBinding(config, min, render, COMMIT_DEBOUNCE_MS);

  input.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  input.addEventListener("input", () => {
    binding.set(clamp(parseFloat(input.value), min, max));
  });

  slider.append(input, display);

  const row = controlRow(config, slider);

  if (config.id !== undefined) {
    row.id = `${config.id}-row`;
  }
  bindEnableRule(row, config.enabledWhen);
  return row;
}
