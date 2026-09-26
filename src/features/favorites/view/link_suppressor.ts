import { EnhancedMouseEvent } from "@/lib/event/input";
import { postPageUrl } from "@/lib/remote/url";

export class FavoritesLinkSuppressor {
  private previousThumb: HTMLElement | null = null;

  public suppressLinkOnHoveredThumb(event: EnhancedMouseEvent): void {
    if (event.thumb === this.previousThumb || event.thumb === null) {
      return;
    }

    if (this.previousThumb !== null) {
      this.previousThumb.querySelector("a")?.setAttribute("href", postPageUrl(this.previousThumb.id));
    }
    event.thumb.querySelector("a")?.removeAttribute("href");
    this.previousThumb = event.thumb;
  }
}
