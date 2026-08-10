import { WidgetSelectors } from "@/lib/ui/widgets/selectors";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/dom/element_factory";
import { toggleDataset } from "@/utils/dom/dataset";

export function searchField(placeholder: string, onChange: (value: string) => void): HTMLElement {
  const input = createElement("input", { className: `${WidgetSelectors.textField} ${WidgetSelectors.searchFieldInput}` });
  const clearButton = createElement("button", { className: WidgetSelectors.searchFieldClear, textContent: "✕" });

  input.type = "text";
  input.placeholder = placeholder;
  input.spellcheck = false;
  input.autocomplete = "off";
  clearButton.type = "button";
  addTooltip(clearButton, "Clear", "below");

  const apply = (): void => {
    toggleDataset(clearButton, "hidden", input.value === "");
    onChange(input.value);
  };
  const clear = (): void => {
    input.value = "";
    apply();
    input.focus();
  };

  apply();
  input.addEventListener("input", apply);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && input.value !== "") {
      event.stopPropagation();
      clear();
    }
  });
  clearButton.addEventListener("click", clear);
  return createElement("div", { className: WidgetSelectors.searchField, children: [input, clearButton] });
}
