import { HostPage } from "@/core/boundary/ports/host_page/host_page";

const LOCKED_VIEWPORT = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";

export class BrowserHostPage implements HostPage {
  public readonly hasHeader = false;

  public setHeaderVisible(): void { }

  public setColorScheme(): void { }

  public reflectSearchPage(): void { }

  public setPaginatorVisible(): void { }

  public claimContent(): HTMLElement {
    return document.body.appendChild(document.createElement("div"));
  }

  public lockViewport(): void {
    const existing = document.querySelector<HTMLMetaElement>("meta[name=viewport]");
    const meta = existing ?? document.createElement("meta");

    meta.name = "viewport";
    meta.content = LOCKED_VIEWPORT;

    if (existing === null) {
      document.head.appendChild(meta);
    }
  }

  public lockScroll(): void {
    this.scroller().style.overflowY = "hidden";
  }

  public unlockScroll(): void {
    this.scroller().style.overflowY = "";
  }

  private scroller(): HTMLElement {
    const scroller = document.scrollingElement;
    return scroller instanceof HTMLElement ? scroller : document.documentElement;
  }
}
