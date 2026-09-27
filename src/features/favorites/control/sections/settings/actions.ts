import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";

export function resetAllButton(onReset: () => void): HTMLElement {
  const button = createElement("button", { children: [icon("reset")] });

  button.type = "button";
  addTooltip(button, "Reset", "below");
  button.addEventListener("click", () => onReset());
  return button;
}
