import { EnhancedMouseEvent } from "@/lib/input";
import { postPageUrl } from "@/lib/remote/url";

let previousThumb: HTMLElement | null = null;

export function suppressLinkOnHoveredThumb(event: EnhancedMouseEvent): void {
  if (event.thumb === previousThumb || event.thumb === null) {
    return;
  }

  if (previousThumb !== null) {
    previousThumb.querySelector("a")?.setAttribute("href", postPageUrl(previousThumb.id));
  }
  event.thumb.querySelector("a")?.removeAttribute("href");
  previousThumb = event.thumb;
}
