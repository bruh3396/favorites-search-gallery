import { ButtonElement, defaultButtonElement } from "@/types/element";
import { WidgetSelectors } from "@/lib/ui/widgets/selectors";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/dom/element_factory";
import { icon } from "@/lib/ui/icon";

export function buildButton(partial: Partial<ButtonElement>): HTMLButtonElement {
  const template = { ...defaultButtonElement, ...partial };
  const button = createElement("button", {
    id: template.id,
    className: template.icon === null ? WidgetSelectors.actionButton : "menu-icon-btn",
    textContent: template.icon === null ? template.textContent : undefined,
    children: template.icon === null ? undefined : [icon(template.icon)]
  });

  button.type = "button";
  addTooltip(button, template.title, "below");

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
