import { CheckboxElement, DEFAULT_MENU_ELEMENT } from "../../types/element_types";
import { DO_NOTHING } from "../../utils/misc/async";
import { Events } from "../global/events/events";
import { isInGallery } from "../../utils/cross_feature/cross_feature_requests";

function createCheckboxTemplate(partial: Partial<CheckboxElement>): CheckboxElement {
  return {
    ...DEFAULT_MENU_ELEMENT,
    savePreference: true,
    event: null,
    defaultValue: false,
    hotkey: "",
    function: DO_NOTHING,
    preference: null,
    triggerOnCreation: false,
    ...partial
  };
}

export function createCheckboxElement(partial: Partial<CheckboxElement>): void {
  const template = createCheckboxTemplate(partial);
  const parent = document.getElementById(template.parentId);

  if (parent === null) {
    return;
  }

  const checkbox = document.createElement("input");

  checkbox.id = template.id;
  checkbox.type = "checkbox";
  checkbox.checked = template.preference === null ? template.defaultValue : template.preference.value;

  const onChange = (): void => {
    if (template.savePreference && template.preference !== null) {
      template.preference.set(checkbox.checked);
    }

    if (template.event !== null) {
      template.event.emit(checkbox.checked);
    }
    template.function(checkbox.checked);
  };

  if (template.triggerOnCreation) {
    onChange();
  }

  checkbox.addEventListener("change", onChange);
  parent.insertAdjacentElement(template.position, checkbox);

  if (template.hotkey === "") {
    return;
  }

  Events.document.keydown.on(async(event) => {
    if (!event.isHotkey || event.key.toLowerCase() !== template.hotkey.toLowerCase()) {
      return;
    }
    const inGallery = await isInGallery();

    if (inGallery) {
      return;
    }
    checkbox.checked = !checkbox.checked;
    onChange();
  });
}

export function createToggleSwitch(partial: Partial<CheckboxElement>): void {
  const template = createCheckboxTemplate(partial);
  const parent = document.getElementById(template.parentId);

  if (parent === null) {
    return;
  }
  const toggleSwitchId = `${template.id}-toggle-switch`;
  const switchHTML = `
    <label id="${toggleSwitchId}" class="toggle-switch" title="${template.title}">
        <span class="slider round"></span>
        <span class="toggle-switch-label"> ${template.textContent}</span>
    </label>`;

  parent.insertAdjacentHTML(template.position, switchHTML);
  template.position = "afterbegin";
  template.parentId = toggleSwitchId;
  createCheckboxElement(template);
  const checkbox = document.getElementById(template.id);

  if (checkbox !== null) {
    checkbox.style.width = "0";
    checkbox.style.height = "0";
    checkbox.style.opacity = "0";
  }
}

export function createCheckboxOption(partial: Partial<CheckboxElement>): void {
  const parent = document.getElementById(partial.parentId || "not-an-id");

  if (parent === null) {
    return;
  }
  const container = document.createElement("div");
  const label = document.createElement("label");
  const span = document.createElement("span");
  const hint = document.createElement("span");
  const labelId = `${partial.id}-label`;

  container.id = `${partial.id}-container`;
  label.id = labelId;
  label.className = "checkbox";
  label.title = partial.title ?? "";
  span.textContent = ` ${partial.textContent ?? "Missing text"}`;
  hint.className = "option-hint";
  hint.textContent = ` (${partial.hotkey ?? "Missing hotkey"})`;

  container.appendChild(label);
  label.appendChild(span);

  if (partial.hotkey !== "" && partial.hotkey !== undefined) {
    label.appendChild(hint);
  }
  parent.insertAdjacentElement(partial.position ?? "afterbegin", container);

  partial.parentId = labelId;
  createCheckboxElement(partial);
}
