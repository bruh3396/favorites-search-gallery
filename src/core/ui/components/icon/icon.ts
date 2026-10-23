import { currentDocument } from "@/core/ui/h/h";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const ICON_PATHS = {
  search: "M17.5 11a6.5 6.5 0 1 1-13 0a6.5 6.5 0 1 1 13 0M16 16l4 4",
  close: "M7 7l10 10M17 7L7 17",
  add: "M12 5v14M5 12h14",
  filter: "M4 5h16l-6 7.5V19l-4 2v-8.5z",
  ban: "M19 12a7 7 0 1 1-14 0a7 7 0 1 1 14 0M7.05 7.05l9.9 9.9",
  chevronLeft: "M15 18l-6-6l6-6",
  chevronRight: "M9 18l6-6l-6-6",
  settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1" +
    "a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20" +
    "a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08" +
    "a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4" +
    "a2 2 0 0 0-2-2zM15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0",
  download: "M12 4v11M7 10l5 5l5-5M5 20h14",
  changelog: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4",
  help: "M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01",
  reset: "M3 12a9 9 0 1 0 9-9a9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5"
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
