import { bindEnableRule, commit, currentValue, syncOnEvent, toBinding } from "@/features/favorites/control/components/state_binding";
import { SelectSetting } from "@/features/favorites/types/setting";
import { SettingsClass } from "@/features/favorites/types/scaffold";
import { controlRow } from "@/features/favorites/control/components/row";

export function buildMultiSegmentedRow<T extends number>(config: Partial<SelectSetting<T>>): HTMLElement {
  const options = config.options ?? new Map<T, string>();
  const binding = toBinding(config, 0 as T);
  let value: number = currentValue(binding);

  if (config.triggerOnCreation === true) {
    commit(binding, value as T, false);
  }

  const group = document.createElement("div");

  group.className = SettingsClass.segmented;

  if (config.id !== undefined) {
    group.id = config.id;
  }

  const buttons = new Map<number, HTMLButtonElement>();

  const isOnlySelectedBit = (bit: number): boolean => value === bit;

  const render = (): void => {
    for (const [bit, button] of buttons) {
      const selected = (value & bit) === bit;

      if (selected) {
        button.dataset.selected = "";
      } else {
        delete button.dataset.selected;
      }
      button.disabled = selected && isOnlySelectedBit(bit);
    }
  };

  for (const [bit, optionLabel] of options) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = SettingsClass.segmentedOption;
    button.textContent = optionLabel;
    button.addEventListener("click", () => {
      const selected = (value & bit) === bit;

      if (selected && isOnlySelectedBit(bit)) {
        return;
      }
      value = selected ? value & ~bit : value | bit;
      render();
      commit(binding, value as T);
    });
    buttons.set(bit, button);
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