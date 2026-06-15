import { SelectElement, defaultMenuElement } from "@/types/element";
import { doNothing } from "@/utils/function";

export function buildSelectElement<T extends string>(partial: Partial<SelectElement<T>>): void {
  const template = createSelectTemplate(partial);
  const parent = document.getElementById(template.parentId);

  const emit = (value: T, save: boolean): void => {
    if (save && template.preference !== null) {
      template.preference.set(value);
    }
    template.function(value);
  };

  const currentValue = (): T => {
    const raw = template.preference === null ? [...template.options.keys()][0] : template.preference.value;
    return (template.isNumeric ? Number(raw) : raw) as T;
  };

  if (template.triggerOnCreation) {
    emit(currentValue(), false);
  }

  if (parent === null) {
    return;
  }
  const select = document.createElement("select");

  select.id = template.id;
  select.title = template.title;

  for (const [value, text] of template.options) {
    const option = document.createElement("option");

    option.id = `${template.id}-${value}`;
    option.value = value;
    option.textContent = text;
    select.appendChild(option);
  }
  parent.insertAdjacentElement(template.position, select);
  select.value = template.preference === null ? Object.keys(template.options)[0] : String(template.preference.value);
  select.onchange = (): void => {
    const value = template.isNumeric ? Number(select.value) : select.value;

    emit(value as T, true);
  };
}

function createSelectTemplate<T extends string>(partial: Partial<SelectElement<T>>): SelectElement<T> {
  return {
    ...defaultMenuElement,
    options: new Map(),
    savePreference: false,
    defaultValue: "" as T,
    function: doNothing,
    triggerOnCreation: false,
    preference: null,
    isNumeric: false,
    ...partial
  };
}
