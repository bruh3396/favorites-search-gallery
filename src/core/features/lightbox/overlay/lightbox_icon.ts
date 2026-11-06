const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const HEART_TOP_PATH = "a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5";

export const LIGHTBOX_ICON_PATHS = {
  close: "M6 6l12 12M18 6L6 18",
  play: "M8 5.5v13l10-6.5z",
  pause: "M9 5v14M15 5v14",
  previous: "M15 5l-7 7 7 7",
  next: "M9 5l7 7-7 7",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  fullscreen: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  exitFullscreen: "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5",
  info: "M20.5 12a8.5 8.5 0 1 1-17 0a8.5 8.5 0 1 1 17 0M12 11v5M12 8h.01",
  tune: "M4 7h9M17 7h3M4 17h3M11 17h9M17 7a2 2 0 1 1-4 0a2 2 0 1 1 4 0M11 17a2 2 0 1 1-4 0a2 2 0 1 1 4 0",
  postPage: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  heartPlus: `M14.479 19.374l-.971.939a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5${HEART_TOP_PATH}a5.2 5.2 0 0 1-.219 1.49M15 15h6M18 12v6`,
  heartFilled: `M2 9.5${HEART_TOP_PATH}c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5`
} as const;

export type LightboxIcon = keyof typeof LIGHTBOX_ICON_PATHS;

export function createLightboxIcon(ownerDocument: Document, icon: LightboxIcon, className: string): SVGSVGElement {
  const svg = ownerDocument.createElementNS(SVG_NAMESPACE, "svg");
  const path = ownerDocument.createElementNS(SVG_NAMESPACE, "path");

  svg.setAttribute("class", className);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  path.setAttribute("d", LIGHTBOX_ICON_PATHS[icon]);

  if (icon === "heartFilled") {
    path.setAttribute("fill", "currentColor");
  }
  svg.append(path);
  return svg;
}
