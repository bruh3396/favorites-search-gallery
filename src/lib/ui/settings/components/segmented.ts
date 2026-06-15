import { bindEnableRule, commit, currentValue, onPreferenceChange, toBinding } from "@/lib/ui/settings/state_binding";
import { SelectSetting } from "@/lib/ui/settings/setting";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { controlRow } from "@/lib/ui/settings/components/row";
import { createElement } from "@/utils/dom/element_factory";
import { toggleDataset } from "@/utils/dom/attribute";

export function buildSegmentedRow<T extends string>(config: Partial<SelectSetting<T>>): HTMLElement {
  const options = config.options ?? new Map<T, string>();
  const binding = toBinding(config, [...options.keys()][0]);
  let value = currentValue(binding);

  if (config.applyOnBuild === true) {
    commit(binding, value, false);
  }
  const group = createElement("div", { id: config.id, className: SettingsClass.segmented });
  const buttons = new Map<T, HTMLButtonElement>();

  const render = (): void => {
    for (const [optionValue, button] of buttons) {
      toggleDataset(button, "selected", optionValue === value);
    }
  };

  const select = (optionValue: T): void => {
    value = optionValue;
    render();
    commit(binding, value);
  };

  for (const [optionValue, optionLabel] of options) {
    const button = createElement("button", { className: SettingsClass.segmentedOption, textContent: optionLabel });

    button.type = "button";
    button.addEventListener("click", () => {
      select(optionValue);
    });
    buttons.set(optionValue, button);
    group.appendChild(button);
  }
  render();

  const row = controlRow(config, group);

  onPreferenceChange(binding, (next) => {
    value = next;
    render();
  });
  bindEnableRule(row, config.enabledWhen);
  return row;
}
