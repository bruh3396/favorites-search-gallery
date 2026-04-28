import { Events } from "./communication/events/events";

export const ROOT = document.createElement("div");
ROOT.id = "favorites-search-gallery";

export const CONTENT = document.createElement("div");
CONTENT.id = "favorites-search-gallery-content";

export const OVERLAYS = document.createElement("div");
OVERLAYS.id = "favorites-search-gallery-overlays";

export function setupShell(): void {
  ROOT.append(CONTENT, OVERLAYS);

  if (document.body !== null) {
    document.body.appendChild(ROOT);
    return;
  }
  Events.document.domLoaded.on(() => {
    document.body.appendChild(ROOT);
  }, { once: true });
}
