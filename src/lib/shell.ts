import { DomEvents } from "./communication/dom_events";

export const Root = document.createElement("div");
Root.id = "favorites-search-gallery";

export const Content = document.createElement("div");
Content.id = "favorites-search-gallery-content";

export const Overlays = document.createElement("div");
Overlays.id = "favorites-search-gallery-overlays";

export function setupShell(): void {
  Root.append(Content, Overlays);
  DomEvents.document.domLoaded.on(() => {
    document.body.appendChild(Root);
  }, { once: true });
}
