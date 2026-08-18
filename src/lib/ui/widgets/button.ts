import { IconName, icon } from "@/lib/ui/icon";
import { Emitter } from "@/lib/communication/emitter";
import { WidgetSelectors } from "@/lib/ui/widgets/selectors";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/platform/factory";

export interface ButtonElement {
  parentId: string;
  id: string;
  enabled: boolean;
  title: string;
  position: InsertPosition;
  textContent: string;
  event: Emitter<MouseEvent> | null;
  rightClickEnabled: boolean;
  icon: IconName | null;
}

export const defaultButtonElement: ButtonElement = {
  parentId: "",
  id: "",
  enabled: true,
  title: "",
  position: "afterbegin",
  textContent: "",
  event: null,
  rightClickEnabled: false,
  icon: null
};

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
