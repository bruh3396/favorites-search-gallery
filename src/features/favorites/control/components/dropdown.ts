import { bindEnableRule, commit, currentValue, syncOnEvent, toBinding } from "@/features/favorites/control/components/state_binding";
import { SelectSetting } from "@/features/favorites/types/setting";
import { SettingsClass } from "@/features/favorites/types/scaffold";
import { controlRow } from "@/features/favorites/control/components/row";
import { icon } from "@/lib/ui/icon";

const closers = new Set<() => void>();

function closeAllExcept(keep: () => void): void {
  for (const closer of closers) {
    if (closer !== keep) {
      closer();
    }
  }
}

export function buildDropdownRow<T extends string>(config: Partial<SelectSetting<T>>): HTMLElement {
  const options = config.options ?? new Map<T, string>();
  const binding = toBinding(config, [...options.keys()][0]);
  let value = currentValue(binding);

  if (config.triggerOnCreation === true) {
    commit(binding, value, false);
  }
  const dropdown = document.createElement("div");

  dropdown.className = SettingsClass.dropdown;

  if (config.id !== undefined) {
    dropdown.id = config.id;
  }
  const button = document.createElement("button");

  button.type = "button";
  button.className = SettingsClass.dropdownButton;
  const buttonLabel = document.createElement("span");

  button.append(buttonLabel, icon("chevronDown"));
  const menu = document.createElement("div");

  menu.className = SettingsClass.dropdownMenu;
  const optionButtons = new Map<T, HTMLButtonElement>();
  const close = (): void => {
    delete dropdown.dataset.open;
  };

  closers.add(close);
  const toggleOpen = (): void => {
    if (dropdown.dataset.open === undefined) {
      closeAllExcept(close);
      dropdown.dataset.open = "";
    } else {
      close();
    }
  };
  const render = (): void => {
    buttonLabel.textContent = options.get(value) ?? "";

    for (const [optionValue, optionButton] of optionButtons) {
      if (optionValue === value) {
        optionButton.dataset.selected = "";
      } else {
        delete optionButton.dataset.selected;
      }
    }
  };

  for (const [optionValue, optionLabel] of options) {
    const optionButton = document.createElement("button");

    optionButton.type = "button";
    optionButton.className = SettingsClass.dropdownOption;
    optionButton.textContent = optionLabel;
    optionButton.addEventListener("click", () => {
      if (optionValue === value) {
        close();
        return;
      }
      value = optionValue;
      render();
      close();
      commit(binding, value);
    });
    optionButtons.set(optionValue, optionButton);
    menu.appendChild(optionButton);
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleOpen();
  });

  dropdown.append(button, menu);
  render();

  const row = controlRow(config.label ?? "", config.tooltip ?? "", dropdown, config.enabled !== false);

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

  syncOnEvent(binding, (next) => {
    value = next;
    render();
  });
  bindEnableRule(row, config.disableOn);
  return row;
}
