import { removeDataset, setDataset, toggleDataset } from "@/utils/browser/dataset";
import { SelectSetting } from "@/lib/ui/settings/setting";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { StateBinding } from "@/lib/ui/settings/state_binding";
import { bindEnableRule } from "@/lib/ui/settings/enable_rule";
import { controlRow } from "@/lib/ui/settings/components/row";
import { createElement } from "@/utils/browser/factory";
import { icon } from "@/lib/ui/icon";

const closers = new Set<() => void>();

export function buildDropdownRow<T extends string>(config: Partial<SelectSetting<T>>): HTMLElement {
  const options = config.options ?? new Map<T, string>();
  const buttonLabel = createElement("span");
  const button = createElement("button", { className: SettingsClass.dropdownButton, children: [buttonLabel, icon("chevronDown")] });

  button.type = "button";
  const menu = createElement("div", { className: SettingsClass.dropdownMenu });
  const dropdown = createElement("div", { id: config.id, className: SettingsClass.dropdown, children: [button, menu] });
  const optionButtons = new Map<T, HTMLButtonElement>();
  const close = (): void => {
    removeDataset(dropdown, "open");
  };

  closers.add(close);
  const toggleOpen = (): void => {
    if (dropdown.dataset.open === undefined) {
      closeAllExcept(close);
      setDataset(dropdown, "open");
    } else {
      close();
    }
  };
  const render = (value: T): void => {
    buttonLabel.textContent = options.get(value) ?? "";

    for (const [optionValue, optionButton] of optionButtons) {
      toggleDataset(optionButton, "selected", optionValue === value);
    }
  };

  const select = (optionValue: T): void => {
    close();
    binding.set(optionValue);
  };

  for (const [optionValue, optionLabel] of options) {
    const optionButton = createElement("button", { className: SettingsClass.dropdownOption, textContent: optionLabel });

    optionButton.type = "button";
    optionButton.addEventListener("click", () => {
      select(optionValue);
    });
    optionButtons.set(optionValue, optionButton);
    menu.appendChild(optionButton);
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleOpen();
  });

  const binding = new StateBinding(config, [...options.keys()][0], render);

  const row = controlRow(config, dropdown);

  row.addEventListener("click", (event) => {
    if (config.enabled === false || dropdown.contains(event.target as Node)) {
      return;
    }
    toggleOpen();
  });

  document.addEventListener("click", (event) => {
    if (!row.contains(event.target as Node)) {
      close();
    }
  });

  bindEnableRule(row, config.enabledWhen);
  return row;
}

function closeAllExcept(keep: () => void): void {
  for (const closer of closers) {
    if (closer !== keep) {
      closer();
    }
  }
}
