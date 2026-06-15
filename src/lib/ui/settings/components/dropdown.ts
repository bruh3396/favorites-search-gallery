import { bindEnableRule, commit, currentValue, onPreferenceChange, toBinding } from "@/lib/ui/settings/state_binding";
import { removeDataset, setDataset, toggleDataset } from "@/utils/dom/attribute";
import { SelectSetting } from "@/lib/ui/settings/setting";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { controlRow } from "@/lib/ui/settings/components/row";
import { createElement } from "@/utils/dom/element_factory";
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

  if (config.applyOnBuild === true) {
    commit(binding, value, false);
  }
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
  const render = (): void => {
    buttonLabel.textContent = options.get(value) ?? "";

    for (const [optionValue, optionButton] of optionButtons) {
      toggleDataset(optionButton, "selected", optionValue === value);
    }
  };

  const select = (optionValue: T): void => {
    if (optionValue === value) {
      close();
      return;
    }
    value = optionValue;
    render();
    close();
    commit(binding, value);
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
  render();

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

  onPreferenceChange(binding, (next) => {
    value = next;
    render();
  });
  bindEnableRule(row, config.enabledWhen);
  return row;
}
