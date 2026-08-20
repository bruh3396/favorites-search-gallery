import { MultiSelectSetting } from "@/lib/ui/settings/setting";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { StateBinding } from "@/lib/ui/settings/state_binding";
import { bindEnableRule } from "@/lib/ui/settings/enable_rule";
import { controlRow } from "@/lib/ui/settings/components/row";
import { createElement } from "@/utils/browser/factory";
import { toggleDataset } from "@/utils/browser/dataset";

export function buildMultiSegmentedRow<T extends number>(config: Partial<MultiSelectSetting<T>>): HTMLElement {
  const options = config.options ?? new Map<T, string>();
  const requiresSelection = config.requireSelection ?? false;
  const group = createElement("div", { id: config.id, className: SettingsClass.segmented });
  const buttons = new Map<number, HTMLButtonElement>();

  const isLocked = (value: number, bit: number): boolean => requiresSelection && value === bit;

  const toggleBit = (bit: number): void => {
    const value = binding.value;
    const isSelected = (value & bit) === bit;

    if (isSelected && isLocked(value, bit)) {
      return;
    }
    binding.set((isSelected ? value & ~bit : value | bit) as T);
  };

  for (const [bit, optionLabel] of options) {
    const button = createElement("button", { className: SettingsClass.segmentedOption, textContent: optionLabel });

    button.type = "button";
    button.addEventListener("click", () => {
      toggleBit(bit);
    });
    buttons.set(bit, button);
    group.appendChild(button);
  }

  const binding = new StateBinding(config, 0 as T, (value) => {
    for (const [bit, button] of buttons) {
      const isSelected = (value & bit) === bit;

      toggleDataset(button, "selected", isSelected);
      button.disabled = isSelected && isLocked(value, bit);
    }
  });

  const row = controlRow(config, group);

  bindEnableRule(row, config.enabledWhen);
  return row;
}
