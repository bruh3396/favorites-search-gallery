import { ButtonElement, defaultButtonElement } from "@/types/element";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { icon } from "@/lib/ui/icon";

export function buildButton(partial: Partial<ButtonElement>): HTMLButtonElement {
  const template = { ...defaultButtonElement, ...partial };
  const button = document.createElement("button");

  button.type = "button";
  button.id = template.id;
  addTooltip(button, template.title, "below");

  if (template.icon === null) {
    button.textContent = template.textContent;
  } else {
    button.classList.add("menu-icon-btn");
    button.appendChild(icon(template.icon));
  }

  button.onclick = (event): void => {
    template.event?.emit(event);
  };

  if (template.rightClickEnabled) {
    button.oncontextmenu = (event): void => {
      template.event?.emit(event);
    };
  }
  return button;
}
