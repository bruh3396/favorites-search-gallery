import { currentDocument } from "@/core/ui/h/h";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const ICON_PATHS = {
  search: "M17.5 11a6.5 6.5 0 1 1-13 0a6.5 6.5 0 1 1 13 0M16 16l4 4",
  close: "M7 7l10 10M17 7L7 17",
  add: "M12 5v14M5 12h14"
} as const;

export type Icon = keyof typeof ICON_PATHS;

export function createIcon(icon: Icon, className: string): SVGSVGElement {
  const ownerDocument = currentDocument();
  const svg = ownerDocument.createElementNS(SVG_NAMESPACE, "svg");
  const path = ownerDocument.createElementNS(SVG_NAMESPACE, "path");

  svg.setAttribute("class", className);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  path.setAttribute("d", ICON_PATHS[icon]);
  svg.append(path);
  return svg;
}
