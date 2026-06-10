import * as TooltipElement from "@/features/tooltip/view/shell/element";
import { getTagSetFromItem } from "@/lib/thumb/tag";

export function renderTooltipContent(thumb: HTMLElement, getColor: (tag: string) => string | null): void {
  TooltipElement.element.replaceChildren();
  let isFirst = true;

  for (const tag of getTagSetFromItem(thumb)) {
    if (!isFirst) {
      TooltipElement.element.appendChild(document.createTextNode(" "));
    }
    TooltipElement.element.appendChild(createTagNode(tag, getColor(tag)));
    isFirst = false;
  }
}

function createTagNode(tag: string, color: string | null): Node {
  if (color === null) {
    return document.createTextNode(tag);
  }
  const span = document.createElement("span");

  span.textContent = tag;
  span.style.color = color;
  return span;
}
