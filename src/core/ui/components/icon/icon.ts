import { Reactive, currentDocument } from "@/core/ui/h/h";
import { effect } from "@/core/utils/reactive/signal";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const HEART_TOP_PATH = "a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5";

export const ICON_PATHS = {
  search: "M17.5 11a6.5 6.5 0 1 1-13 0a6.5 6.5 0 1 1 13 0M16 16l4 4",
  close: "M7 7l10 10M17 7L7 17",
  closeLarge: "M6 6l12 12M18 6L6 18",
  play: "M8 5.5v13l10-6.5z",
  pause: "M9 5v14M15 5v14",
  chevronLeftLarge: "M15 5l-7 7 7 7",
  chevronRightLarge: "M9 5l7 7-7 7",
  fullscreen: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  exitFullscreen: "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5",
  info: "M20.5 12a8.5 8.5 0 1 1-17 0a8.5 8.5 0 1 1 17 0M12 11v5M12 8h.01",
  tune: "M4 7h9M17 7h3M4 17h3M11 17h9M17 7a2 2 0 1 1-4 0a2 2 0 1 1 4 0M11 17a2 2 0 1 1-4 0a2 2 0 1 1 4 0",
  postPage: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  heartPlus: `M14.479 19.374l-.971.939a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5${HEART_TOP_PATH}a5.2 5.2 0 0 1-.219 1.49M15 15h6M18 12v6`,
  heartFilled: `M2 9.5${HEART_TOP_PATH}c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5`,
  add: "M12 5v14M5 12h14",
  subtract: "M5 12h14",
  ban: "M20.75 12a8.75 8.75 0 1 1-17.5 0a8.75 8.75 0 1 1 17.5 0M5.81 5.81l12.38 12.38",
  chevronLeft: "M15 18l-6-6l6-6",
  chevronRight: "M9 18l6-6l-6-6",
  chevronDown: "M6 9l6 6l6-6",
  check: "M20 6L9 17l-5-5",
  tag: "M3 12V4h8l10 10-8 8zM8.5 8a1 1 0 1 1-2 0a1 1 0 1 1 2 0",
  sliders: "M4 7h10M18 7h2M4 17h4M12 17h8M18 7a2 2 0 1 1-4 0a2 2 0 1 1 4 0M12 17a2 2 0 1 1-4 0a2 2 0 1 1 4 0",
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
  leaf: "M11 20a10 10 0 0 0 10-10 25.9 25.9 0 0 0-1.04-7.281 1 1 0 0 0-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0 0 11 20" +
    "M2 21a5 5 0 0 1 2.911-4.544C7.613 15.212 8.351 15.24 11 13",
  layoutColumn: "M2.25 2.25H6.75V12.75H2.25zM2.25 15.75H6.75V21.75H2.25zM9.75 2.25H14.25V6.75H9.75zM9.75 9.75H14.25V21.75H9.75z" +
    "M17.25 2.25H21.75V15.75H17.25zM17.25 18.75H21.75V21.75H17.25z",
  layoutRow: "M2.25 2.25H12.75V6.75H2.25zM15.75 2.25H21.75V6.75H15.75zM2.25 9.75H6.75V14.25H2.25zM9.75 9.75H21.75V14.25H9.75z" +
    "M2.25 17.25H9.75V21.75H2.25zM12.75 17.25H21.75V21.75H12.75z",
  layoutSquare: "M2.25 2.25H6.75V6.75H2.25zM9.75 2.25H14.25V6.75H9.75zM17.25 2.25H21.75V6.75H17.25z" +
    "M2.25 9.75H6.75V14.25H2.25zM9.75 9.75H14.25V14.25H9.75zM17.25 9.75H21.75V14.25H17.25z" +
    "M2.25 17.25H6.75V21.75H2.25zM9.75 17.25H14.25V21.75H9.75zM17.25 17.25H21.75V21.75H17.25z",
  layoutGrid: "M3.75 3.75H9.75V11.25H3.75zM14.25 3.75H20.25V8.25H14.25zM3.75 14.25H9.75V20.25H3.75zM14.25 14.25H20.25V17.25H14.25z",
  layoutNative: "M2.25 2.25H6.75V9.75H2.25zM9.75 3.75H14.25V8.25H9.75zM17.25 2.25H21.75V9.75H17.25z" +
    "M2.25 15.75H6.75V20.25H2.25zM9.75 14.25H14.25V21.75H9.75zM17.25 15.75H21.75V20.25H17.25z",
  keyboard: "M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8",
  pencil: "M21.17 6.81a2.82 2.82 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5zM15 5l4 4",
  bookmark: "M19 21l-7-4l-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z",
  logo: "M20.6 5.98A10.5 10.5 0 1 0 22.5 12H19.5M7.13 15.75V8.25H10.88M7.13 12H10.13" +
    "M16.2 9.6C15.9 8.7 15.15 8.25 14.25 8.25C13.05 8.25 12.3 8.93 12.3 10.13C12.3 11.32 13.28 11.7 14.32 12" +
    "C15.53 12.3 16.35 12.75 16.35 13.95C16.35 15.15 15.45 15.75 14.25 15.75C13.2 15.75 12.45 15.3 12.15 14.4"
} as const;

export type Icon = keyof typeof ICON_PATHS;

const FILLED_ICONS: ReadonlySet<Icon> = new Set(["heartFilled"]);

export function createIcon(icon: Reactive<Icon>, className: string): SVGSVGElement {
  const ownerDocument = currentDocument();
  const svg = ownerDocument.createElementNS(SVG_NAMESPACE, "svg");
  const path = ownerDocument.createElementNS(SVG_NAMESPACE, "path");
  const draw = (currentIcon: Icon): void => {
    path.setAttribute("d", ICON_PATHS[currentIcon]);

    if (FILLED_ICONS.has(currentIcon)) {
      path.setAttribute("fill", "currentColor");
    } else {
      path.removeAttribute("fill");
    }
  };

  svg.setAttribute("class", className);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  if (typeof icon === "string") {
    draw(icon);
  } else {
    effect(() => draw(icon.value));
  }
  svg.append(path);
  return svg;
}
