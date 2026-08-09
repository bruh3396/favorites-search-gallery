import { getTagSetFromThumb } from "@/lib/thumb/tag";

export function render(tooltip: HTMLElement, thumb: HTMLElement, getColor: (tag: string) => string | null): void {
  tooltip.replaceChildren();
  let isFirst = true;

  for (const tag of getTagSetFromThumb(thumb)) {
    if (!isFirst) {
      tooltip.appendChild(document.createTextNode(" "));
    }
    tooltip.appendChild(createTagNode(tag, getColor(tag)));
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
