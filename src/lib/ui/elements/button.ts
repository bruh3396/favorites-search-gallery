import { ButtonElement, defaultMenuElement } from "@/types/element";
import { doNothing } from "@/utils/function";

export function buildButtonElement(partial: Partial<ButtonElement>): void {
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

  button.onclick = (event): void => {
    template.function(event);
    template.event?.emit(event);
  };

  if (template.rightClickEnabled) {
    button.oncontextmenu = (event): void => {
      template.event?.emit(event);
    };
  }
}

function createButtonTemplate(partial: Partial<ButtonElement>): ButtonElement {
  return {
    ...defaultMenuElement,
    event: null,
    function: doNothing,
    triggerOnCreation: false,
    hotkey: "",
    rightClickEnabled: false,
    ...partial
  };
}
