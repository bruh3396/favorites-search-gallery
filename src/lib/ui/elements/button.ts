import { ButtonElement, defaultMenuElement } from "../element_types";
import { doNothing } from "../../environment/constants";

function createButtonTemplate(partial: Partial<ButtonElement>): ButtonElement {
  return {
    ...defaultMenuElement,
    event: null,
    hotkey: "",
    function: doNothing,
    triggerOnCreation: false,
    rightClickEnabled: false,
    ...partial
  };
}

export function createButtonElement(partial: Partial<ButtonElement>): void {
  const template = createButtonTemplate(partial);
  const parent = document.getElementById(template.parentId);

  if (!template.enabled || parent === null) {
    return;
  }
  const button = document.createElement("button");

  parent.insertAdjacentElement(template.position, button);
  button.id = template.id;
  button.title = template.title;
  button.textContent = template.textContent;

  if (template.event === null) {
    return;
  }
  const eventEmitter = template.event;

  button.onclick = (event): void => {
    template.function(event);
    eventEmitter.emit(event);
  };

  if (template.rightClickEnabled) {
    button.oncontextmenu = (event): void => {
      eventEmitter.emit(event);
    };
  }
}
