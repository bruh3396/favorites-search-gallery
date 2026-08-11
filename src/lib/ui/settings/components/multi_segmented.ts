import { MultiSelectSetting } from "@/lib/ui/settings/setting";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { StateBinding } from "@/lib/ui/settings/state_binding";
import { bindEnableRule } from "@/lib/ui/settings/enable_rule";
import { controlRow } from "@/lib/ui/settings/components/row";
import { createElement } from "@/utils/dom/element_factory";
import { toggleDataset } from "@/utils/dom/dataset";

export function buildMultiSegmentedRow<T extends number>(config: Partial<MultiSelectSetting<T>>): HTMLElement {
  const options = config.options ?? new Map<T, string>();
  const requireSelection = config.requireSelection ?? false;
  const group = createElement("div", { id: config.id, className: SettingsClass.segmented });
  const buttons = new Map<number, HTMLButtonElement>();

  const isLocked = (value: number, bit: number): boolean => requireSelection && value === bit;

  const toggleBit = (bit: number): void => {
    const value = binding.value;
    const selected = (value & bit) === bit;

    if (selected && isLocked(value, bit)) {
      return;
    }
    binding.set((selected ? value & ~bit : value | bit) as T);
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
      const selected = (value & bit) === bit;

      toggleDataset(button, "selected", selected);
      button.disabled = selected && isLocked(value, bit);
    }
  });

  const row = controlRow(config, group);

  bindEnableRule(row, config.enabledWhen);
  return row;
}
