import { DomEvents } from "@/app/input/dom_events";

export const Root = document.createElement("div");
Root.id = "favorites-search-gallery";

export const Body = document.createElement("div");
Body.id = "favorites-search-gallery-body";

export const ContentColumn = document.createElement("div");
ContentColumn.id = "favorites-search-gallery-content-column";

export const Content = document.createElement("div");
Content.id = "favorites-search-gallery-content";

export const ContentRow = document.createElement("div");
ContentRow.id = "favorites-search-gallery-content-row";

export const DrawerTrack = document.createElement("div");
DrawerTrack.id = "favorites-search-gallery-drawer-track";

export const Overlays = document.createElement("div");
Overlays.id = "favorites-search-gallery-overlays";

export const ScrollSentinelTop = document.createElement("div");
ScrollSentinelTop.id = "scroll-sentinel-top";

export const ScrollSentinelBottom = document.createElement("div");
ScrollSentinelBottom.id = "scroll-sentinel-bottom";

export function setupShell(): void {
  ContentColumn.append(ScrollSentinelTop, Content, ScrollSentinelBottom);
  ContentRow.append(DrawerTrack, ContentColumn);
  Body.append(ContentRow);
  Root.append(Body, Overlays);
  DomEvents.document.domLoaded.on(() => {
    document.body.appendChild(Root);
  }, { once: true });
}
