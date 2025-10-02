import { DEFAULT_MENU_ELEMENT, NumberElement } from "../../types/element_types";
import { DO_NOTHING } from "../../utils/misc/async";
import { Events } from "../global/events/events";
import { NumberComponent } from "./number_component";

function createNumberTemplate(partial: Partial<NumberElement>): NumberElement {
  return {
    ...DEFAULT_MENU_ELEMENT,
    savePreference: false,
    event: null,
    function: DO_NOTHING,
    triggerOnCreation: false,
    preference: null,
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 10,
    pollingTime: 50,
    ...partial
  };
}

export function createNumberComponent(partial: Partial<NumberElement>): void {
  const template = createNumberTemplate(partial);
  const parent = document.getElementById(template.parentId);

  if (parent === null) {
    return;
  }
  const numberComponentId = `${template.id}-number`;
  const defaultValue = template.preference === null ? 1 : template.preference.value;

  const html = `
    <span class="number" id="${numberComponentId}">
      <hold-button class="number-arrow-down" pollingtime="${template.pollingTime}">
        <span>&lt;</span>
      </hold-button>
      <input id="${template.id}" type="number" min="${template.min}" max="${template.max}" step="${template.step}" defaultValue="${defaultValue}">
      <hold-button class="number-arrow-up" pollingtime="${template.pollingTime}">
        <span>&gt;</span>
      </hold-button>
    </span>
  `;

  parent.insertAdjacentHTML(template.position, html);
  const element = document.getElementById(numberComponentId);

  if (element === null) {
    return;
  }
  const numberComponent = new NumberComponent(element);
  const numberInput = numberComponent.input;
  const emitEvent = (): void => {
    const value = parseFloat(numberInput.value);

    if (template.event !== null) {
      template.event.emit(value);
    }

    if (template.preference !== null) {
      template.preference.set(value);
    }
  };

  if (numberInput === null) {
    return;
  }

  numberInput.value = String(defaultValue);
  numberInput.dispatchEvent(new KeyboardEvent("keydown", {
    key: "Enter",
    bubbles: true
  }));

  if (template.triggerOnCreation) {
    Events.document.postProcess.on(() => {
      emitEvent();
    });
  }

  numberInput.onchange = (): void => {
    emitEvent();
    template.preference?.set(parseFloat(numberInput.value));
  };
}
