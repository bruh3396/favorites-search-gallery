import { CheckboxElement, defaultMenuElement } from "@/types/element";
import { DomEvents } from "@/app/dom/events";
import { doNothing } from "@/utils/function";
import { galleryOpened } from "@/app/channels/feature_bridge";

export function buildCheckboxElement(partial: Partial<CheckboxElement>): void {
  const template = createCheckboxTemplate(partial);
  const parent = document.getElementById(template.parentId);

  let checked = template.preference === null ? template.defaultValue : template.preference.value;

  const onChange = (save: boolean = true): void => {
    if (save && template.savePreference && template.preference !== null) {
      template.preference.set(checked);
    }
    template.function(checked);
  };

  if (template.triggerOnCreation) {
    onChange(false);
  }

  if (parent === null) {
    return;
  }

  const checkbox = document.createElement("input");

  checkbox.id = template.id;
  checkbox.type = "checkbox";
  checkbox.checked = checked;
  checkbox.addEventListener("change", (): void => {
    checked = checkbox.checked;
    onChange();
  });
  parent.insertAdjacentElement(template.position, checkbox);

  if (template.hotkey === "") {
    return;
  }

  DomEvents.document.keydown.on((event) => {
    if (!event.isHotkey || event.key.toLowerCase() !== template.hotkey.toLowerCase()) {
      return;
    }

    if (galleryOpened()) {
      return;
    }
    checked = !checked;
    checkbox.checked = checked;
    onChange();
  });
}

export function buildToggleSwitch(partial: Partial<CheckboxElement>): void {
  const template = createCheckboxTemplate(partial);
  const parent = document.getElementById(template.parentId);

  if (parent === null) {
    buildCheckboxElement(template);
    return;
  }
  const toggleSwitchId = `${template.id}-toggle-switch`;
  const switchHtml = `
    <label id="${toggleSwitchId}" class="opt-toggle" title="${template.title}">
        <span class="opt-toggle-track opt-toggle-track--round"></span>
        <span class="opt-toggle-label">${template.textContent}</span>
    </label>`;

  parent.insertAdjacentHTML(template.position, switchHtml);
  template.position = "afterbegin";
  template.parentId = toggleSwitchId;
  buildCheckboxElement(template);
  const checkbox = document.getElementById(template.id);

  if (checkbox !== null) {
    checkbox.style.width = "0";
    checkbox.style.height = "0";
    checkbox.style.opacity = "0";
  }
}

export function buildCheckboxOption(partial: Partial<CheckboxElement>): void {
  const parent = document.getElementById(partial.parentId || "not-an-id");

  if (parent === null) {
    buildCheckboxElement(partial);
    return;
  }
  const container = document.createElement("div");
  const label = document.createElement("label");
  const span = document.createElement("span");
  const hint = document.createElement("span");
  const labelId = `${partial.id}-label`;

  container.id = `${partial.id}-container`;
  label.id = labelId;
  label.className = "opt-checkbox";
  label.title = partial.title ?? "";
  span.textContent = `${partial.textContent ?? "Missing text"}`;
  hint.className = "u-opt-hint";
  hint.textContent = ` (${partial.hotkey ?? "Missing hotkey"})`;

  container.appendChild(label);
  label.appendChild(span);

  if (partial.hotkey !== "" && partial.hotkey !== undefined) {
    label.appendChild(hint);
  }
  parent.insertAdjacentElement(partial.position ?? "afterbegin", container);

  partial.parentId = labelId;
  buildCheckboxElement(partial);
}

function createCheckboxTemplate(partial: Partial<CheckboxElement>): CheckboxElement {
  return {
    ...defaultMenuElement,
    savePreference: true,
    defaultValue: false,
    hotkey: "",
    function: doNothing,
    preference: null,
    triggerOnCreation: false,
    ...partial
  };
}
