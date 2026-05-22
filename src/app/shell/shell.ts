import { DomEvents } from "../input/dom_events";

export const Root = document.createElement("div");
Root.id = "favorites-search-gallery";

export const Content = document.createElement("div");
Content.id = "favorites-search-gallery-content";

export const Overlays = document.createElement("div");
Overlays.id = "favorites-search-gallery-overlays";

export const ScrollSentinelTop = document.createElement("div");
ScrollSentinelTop.id = "scroll-sentinel-top";

export const ScrollSentinelBottom = document.createElement("div");
ScrollSentinelBottom.id = "scroll-sentinel-bottom";

export function setupShell(): void {
  Root.append(ScrollSentinelTop, Content, ScrollSentinelBottom, Overlays);
  DomEvents.document.domLoaded.on(() => {
    document.body.appendChild(Root);
  }, { once: true });
}
