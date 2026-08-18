import { SelectSetting } from "@/lib/ui/settings/setting";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { StateBinding } from "@/lib/ui/settings/state_binding";
import { bindEnableRule } from "@/lib/ui/settings/enable_rule";
import { controlRow } from "@/lib/ui/settings/components/row";
import { createElement } from "@/utils/platform/factory";
import { toggleDataset } from "@/utils/platform/dataset";

export function buildSegmentedRow<T extends string | number>(config: Partial<SelectSetting<T>>): HTMLElement {
  const options = config.options ?? new Map<T, string>();
  const group = createElement("div", { id: config.id, className: SettingsClass.segmented });
  const buttons = new Map<T, HTMLButtonElement>();

  for (const [optionValue, optionLabel] of options) {
    const button = createElement("button", { className: SettingsClass.segmentedOption, textContent: optionLabel });

    button.type = "button";
    button.addEventListener("click", () => {
      binding.set(optionValue);
    });
    buttons.set(optionValue, button);
    group.appendChild(button);
  }

  const binding = new StateBinding(config, [...options.keys()][0], (value) => {
    for (const [optionValue, button] of buttons) {
      toggleDataset(button, "selected", optionValue === value);
    }
  });

  const row = controlRow(config, group);

  bindEnableRule(row, config.enabledWhen);
  return row;
}
