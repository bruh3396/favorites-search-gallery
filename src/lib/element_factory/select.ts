import { DEFAULT_MENU_ELEMENT, SelectElement } from "../../types/elements/menu_element";
import { DO_NOTHING } from "../../config/constants";

function createSelectTemplate<T extends string>(partial: Partial<SelectElement<T>>): SelectElement<T> {
  return {
    ...DEFAULT_MENU_ELEMENT,
    options: {} as Record<T, string>,
    savePreference: false,
    defaultValue: "" as T,
    event: null,
    hotkey: "",
    function: DO_NOTHING,
    triggerOnCreation: false,
    preference: null,
    ...partial
  };
}

export function createSelectElement<T extends string>(partial: Partial<SelectElement<T>>): void {
  const template = createSelectTemplate(partial);
  const parent = document.getElementById(template.parentId);

  if (parent === null) {
    return;
  }
  const select = document.createElement("select");

  select.id = template.id;
  select.title = template.title;

  for (const [value, text] of Object.entries<string>(template.options)) {
    const option = document.createElement("option");

    option.id = `${template.id}-${value}`;
    option.value = value;
    option.textContent = text;
    select.appendChild(option);
  }
  parent.insertAdjacentElement(template.position, select);

  const onChange = (): void => {
    if (template.event !== null) {
      template.event.emit(select.value as T);
    }

    if (template.preference !== null) {
      template.preference.set(select.value as T);
    }
    template.function(select.value as T);
  };

  if (template.preference === null) {
    select.value = Object.keys(template.options)[0];
  } else {
    select.value = String(template.preference.value);
  }

  if (template.triggerOnCreation) {
    // onChange();
  }

  select.onchange = (): void => {
    onChange();

    if (template.preference !== null) {
      template.preference.set(select.value as T);
    }
  };
}
