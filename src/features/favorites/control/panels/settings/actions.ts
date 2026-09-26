import { Preference } from "@/lib/storage/preference";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";
import { reloadWindow } from "@/utils/browser/window";

export function resetAllButton(): HTMLElement {
  const button = createElement("button", { children: [icon("reset")] });

  button.type = "button";
  addTooltip(button, "Reset", "below");
  button.addEventListener("click", () => {
    if (window.confirm("Reset all settings?")) {
      Preference.resetAll();
      reloadWindow();
    }
  });
  return button;
}
