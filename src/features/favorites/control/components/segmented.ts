import { bindEnableRule, commit, currentValue, syncOnEvent, toBinding } from "@/features/favorites/control/components/state_binding";
import { SelectSetting } from "@/features/favorites/types/setting";
import { SettingsClass } from "@/features/favorites/types/scaffold";
import { controlRow } from "@/features/favorites/control/components/row";

export function buildSegmentedRow<T extends string>(config: Partial<SelectSetting<T>>): HTMLElement {
  const options = config.options ?? new Map<T, string>();
  const binding = toBinding(config, [...options.keys()][0]);
  let value = currentValue(binding);

  if (config.triggerOnCreation === true) {
    commit(binding, value, false);
  }

  const group = document.createElement("div");

  group.className = SettingsClass.segmented;

  if (config.id !== undefined) {
    group.id = config.id;
  }

  const buttons = new Map<T, HTMLButtonElement>();

  const render = (): void => {
    for (const [optionValue, button] of buttons) {
      if (optionValue === value) {
        button.dataset.selected = "";
      } else {
        delete button.dataset.selected;
      }
    }
  };

  for (const [optionValue, optionLabel] of options) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = SettingsClass.segmentedOption;
    button.textContent = optionLabel;
    button.addEventListener("click", () => {
      value = optionValue;
      render();
      commit(binding, value);
    });
    buttons.set(optionValue, button);
    group.appendChild(button);
  }
  render();

  const row = controlRow(config.label ?? "", config.tooltip ?? "", group, config.enabled !== false);

  syncOnEvent(binding, (next) => {
    value = next;
    render();
  });
  bindEnableRule(row, config.disableOn);
  return row;
}