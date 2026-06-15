import { DomEvents } from "@/app/dom/events";
import { div } from "@/utils/dom/element_factory";

export const Root = div("favorites-search-gallery");
export const Content = div("favorites-search-gallery-content");
export const Overlays = div("favorites-search-gallery-overlays");
export const ScrollSentinelTop = div("scroll-sentinel-top");
export const ScrollSentinelBottom = div("scroll-sentinel-bottom");

export function setupShell(): void {
  Root.append(Overlays);
  DomEvents.document.domLoaded.on(() => {
    document.body.appendChild(Root);
  }, { once: true });
}
