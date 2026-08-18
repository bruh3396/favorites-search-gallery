import { WidgetSelectors } from "@/lib/ui/widgets/selectors";
import { createElement } from "@/utils/platform/factory";

export function separator(className: string = ""): HTMLElement {
  return createElement("div", { className: `${WidgetSelectors.separator} ${className}`.trim() });
}
