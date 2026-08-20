import { DomEvents } from "@/app/dom/events";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { div } from "@/utils/browser/factory";

export const Root = div("favorites-search-gallery");
export const Content = div("favorites-search-gallery-content");
export const Overlays = div("favorites-search-gallery-overlays");
export const ScrollSentinelTop = div("scroll-sentinel-top");
export const ScrollSentinelBottom = div("scroll-sentinel-bottom");

export function setupShell(): void {
  if (ON_MOBILE_DEVICE) {
    Root.dataset.mobile = "";
    lockViewport();
  }
  Root.append(Overlays);
  DomEvents.document.domLoaded.on(() => {
    document.body.appendChild(Root);
  }, { once: true });
}

function lockViewport(): void {
  const content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";
  const existing = document.querySelector<HTMLMetaElement>("meta[name=viewport]");
  const meta = existing ?? document.createElement("meta");

  meta.name = "viewport";
  meta.content = content;

  if (existing === null) {
    document.head.appendChild(meta);
  }
}
