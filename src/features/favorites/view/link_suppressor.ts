import { EnhancedMouseEvent } from "@/lib/event/input";

export class FavoritesLinkSuppressor {
  private previousThumb: HTMLElement | null = null;

  constructor(private readonly postUrl: (id: string) => string) { }

  public suppressLinkOnHoveredThumb(event: EnhancedMouseEvent): void {
    if (event.thumb === this.previousThumb || event.thumb === null) {
      return;
    }

    if (this.previousThumb !== null) {
      this.previousThumb.querySelector("a")?.setAttribute("href", this.postUrl(this.previousThumb.id));
    }
    event.thumb.querySelector("a")?.removeAttribute("href");
    this.previousThumb = event.thumb;
  }
}
