import { Viewport } from "@/core/boundary/ports/viewport/viewport";

const LOCKED_VIEWPORT = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";

export class BrowserViewport implements Viewport {
  public lockScroll(): void {
    this.scroller().style.overflowY = "hidden";
  }

  public unlockScroll(): void {
    this.scroller().style.overflowY = "";
  }

  public lockZoom(): void {
    const existing = document.querySelector<HTMLMetaElement>("meta[name=viewport]");
    const meta = existing ?? document.createElement("meta");

    meta.name = "viewport";
    meta.content = LOCKED_VIEWPORT;

    if (existing === null) {
      document.head.appendChild(meta);
    }
  }

  private scroller(): HTMLElement {
    const scroller = document.scrollingElement;
    return scroller instanceof HTMLElement ? scroller : document.documentElement;
  }
}
