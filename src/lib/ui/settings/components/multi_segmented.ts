import { bindEnableRule, commit, currentValue, onPreferenceChange, toBinding } from "@/lib/ui/settings/state_binding";
import { SelectSetting } from "@/lib/ui/settings/setting";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { controlRow } from "@/lib/ui/settings/components/row";
import { createElement } from "@/utils/dom/element_factory";
import { toggleDataset } from "@/utils/dom/attribute";

export function buildMultiSegmentedRow<T extends number>(config: Partial<SelectSetting<T>>): HTMLElement {
  const options = config.options ?? new Map<T, string>();
  const binding = toBinding(config, 0 as T);
  let value: number = currentValue(binding);

  if (config.applyOnBuild === true) {
    commit(binding, value as T, false);
  }
  const group = createElement("div", { id: config.id, className: SettingsClass.segmented });
  const buttons = new Map<number, HTMLButtonElement>();

  const isOnlySelectedBit = (bit: number): boolean => value === bit;

  const render = (): void => {
    for (const [bit, button] of buttons) {
      const selected = (value & bit) === bit;

      toggleDataset(button, "selected", selected);
      button.disabled = selected && isOnlySelectedBit(bit);
    }
  };

  const toggleBit = (bit: number): void => {
    const selected = (value & bit) === bit;

    if (selected && isOnlySelectedBit(bit)) {
      return;
    }
    value = selected ? value & ~bit : value | bit;
    render();
    commit(binding, value as T);
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
  render();

  const row = controlRow(config, group);

  onPreferenceChange(binding, (next) => {
    value = next;
    render();
  });
  bindEnableRule(row, config.enabledWhen);
  return row;
}
