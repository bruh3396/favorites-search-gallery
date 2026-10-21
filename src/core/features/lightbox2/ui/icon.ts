const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export const LIGHTBOX_ICON_PATHS = {
  close: "M6 6l12 12M18 6L6 18",
  previous: "M15 5l-7 7 7 7",
  next: "M9 5l7 7-7 7",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  fullscreen: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  exitFullscreen: "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5",
  postPage: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
} as const;

export type LightboxIcon = keyof typeof LIGHTBOX_ICON_PATHS;

export function createLightboxIcon(ownerDocument: Document, icon: LightboxIcon, className: string): SVGSVGElement {
  const svg = ownerDocument.createElementNS(SVG_NAMESPACE, "svg");
  const path = ownerDocument.createElementNS(SVG_NAMESPACE, "path");

  svg.setAttribute("class", className);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  path.setAttribute("d", LIGHTBOX_ICON_PATHS[icon]);
  svg.append(path);
  return svg;
}
