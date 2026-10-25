import { Reactive, currentDocument } from "@/core/ui/h/h";
import { effect } from "@/core/utils/reactive/signal";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const ICON_PATHS = {
  search: "M17.5 11a6.5 6.5 0 1 1-13 0a6.5 6.5 0 1 1 13 0M16 16l4 4",
  close: "M7 7l10 10M17 7L7 17",
  add: "M12 5v14M5 12h14",
  subtract: "M5 12h14",
  filter: "M4 5h16l-6 7.5V19l-4 2v-8.5z",
  ban: "M19 12a7 7 0 1 1-14 0a7 7 0 1 1 14 0M7.05 7.05l9.9 9.9",
  chevronLeft: "M15 18l-6-6l6-6",
  chevronRight: "M9 18l6-6l-6-6",
  chevronDown: "M6 9l6 6l6-6",
  check: "M20 6L9 17l-5-5",
  settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1" +
    "a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20" +
    "a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08" +
    "a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4" +
    "a2 2 0 0 0-2-2zM15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0",
  download: "M12 4v11M7 10l5 5l5-5M5 20h14",
  changelog: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4",
  help: "M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01",
  reset: "M3 12a9 9 0 1 0 9-9a9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5",
  sun: "M16 12a4 4 0 1 1-8 0a4 4 0 1 1 8 0M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41",
  moon: "M12 3a6 6 0 0 0 9 9a9 9 0 1 1-9-9z",
  alignLeft: "M4 6h16M4 12h10M4 18h14",
  alignCenter: "M4 6h16M7 12h10M5 18h14",
  tagsGrouped: "M4 5h6M8 9.5h12M4 14.5h6M8 19h12",
  tagsFlat: "M4 7h6M13 7h7M4 12h9M16 12h4M4 17h4M11 17h9",
  textSmall: "M14.25 15.75l1.91-5.5a.77.77 0 0 1 1.45 0L19.5 15.75M14.78 14.25h4.2M4.5 15.75l3.03-7.27a.38.38 0 0 1 .69 0L10.5 15.75M5.48 13.5h4.8",
  textMedium: "M14.7 16.5l2.29-6.6a.92.92 0 0 1 1.74 0L21 16.5M15.33 14.7h5.04M3 16.5l3.64-8.72a.45.45 0 0 1 .83 0L10.9 16.5M4.17 13.8h5.76",
  textLarge: "M15.3 17.5l2.79-8.06a1.12 1.12 0 0 1 2.12 0L23 17.5M16.07 15.3h6.16M1 17.5l4.44-10.66a.55.55 0 0 1 1.01 0L10.9 17.5M2.43 14.2h7.04",
  expandAll: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 12h8M12 8v8",
  collapseAll: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 12h8",
  appWindow: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM2 8h20M6 4v4M10 4v4",
  scan: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2",
  layoutColumn: "M3.75 3.75H9.75V12.75H3.75zM3.75 15.75H9.75V20.25H3.75zM14.25 3.75H20.25V8.25H14.25zM14.25 11.25H20.25V20.25H14.25z",
  layoutRow: "M3.75 3.75H11.25V9.75H3.75zM14.25 3.75H20.25V9.75H14.25zM3.75 14.25H8.25V20.25H3.75zM11.25 14.25H20.25V20.25H11.25z",
  layoutSquare: "M3.75 3.75H9.75V9.75H3.75zM14.25 3.75H20.25V9.75H14.25zM3.75 14.25H9.75V20.25H3.75zM14.25 14.25H20.25V20.25H14.25z",
  layoutGrid: "M3.75 3.75H9.75V11.25H3.75zM14.25 3.75H20.25V8.25H14.25zM3.75 14.25H9.75V20.25H3.75zM14.25 14.25H20.25V17.25H14.25z",
  layoutNative: "M2.25 5.25H6.75V9.75H2.25zM9.75 3.75H14.25V9.75H9.75zM17.25 5.25H21.75V8.25H17.25z" +
    "M2.25 14.25H6.75V20.25H2.25zM9.75 15.75H14.25V18.75H9.75zM17.25 14.25H21.75V18.75H17.25z"
} as const;

export type Icon = keyof typeof ICON_PATHS;

export function createIcon(icon: Reactive<Icon>, className: string): SVGSVGElement {
  const ownerDocument = currentDocument();
  const svg = ownerDocument.createElementNS(SVG_NAMESPACE, "svg");
  const path = ownerDocument.createElementNS(SVG_NAMESPACE, "path");

  svg.setAttribute("class", className);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  if (typeof icon === "string") {
    path.setAttribute("d", ICON_PATHS[icon]);
  } else {
    effect(() => path.setAttribute("d", ICON_PATHS[icon.value]));
  }
  svg.append(path);
  return svg;
}
