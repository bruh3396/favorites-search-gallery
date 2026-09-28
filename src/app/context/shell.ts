import { COLUMN_SELECTOR, ITEM_SELECTOR } from "@/lib/ui/thumb/selectors";
import { getItemsInContainer, getThumbsInMatrix } from "@/lib/ui/thumb/query";
import { div } from "@/utils/browser/element";
import { waitForThumbsToLoadInContainer } from "@/lib/ui/thumb/loading";

export class Shell {
  public readonly root = div("favorites-search-gallery");
  public readonly content = div("favorites-search-gallery-content");
  public readonly overlays = div("favorites-search-gallery-overlays");
  public readonly scrollSentinelTop = div("scroll-sentinel-top");
  public readonly scrollSentinelBottom = div("scroll-sentinel-bottom");

  public mount(into: HTMLElement): void {
    this.root.append(this.overlays);
    into.appendChild(this.root);
  }

  public getContentThumbs(): HTMLElement[] {
    return this.usingColumnLayout() ? getThumbsInMatrix(this.content) : getItemsInContainer(this.content);
  }

  public getFirstContentThumb(): HTMLElement | null {
    return this.content.querySelector<HTMLElement>(ITEM_SELECTOR);
  }

  public findThumb(id: string): HTMLElement | null {
    return this.content.querySelector<HTMLElement>(`[id="${id}"]`);
  }

  public hasThumb(id: string): boolean {
    return this.findThumb(id) !== null;
  }

  public getPageThumbs(): HTMLElement[] {
    return getItemsInContainer(document);
  }

  public getPaginator(): HTMLElement | null {
    return document.getElementById("paginator");
  }

  public waitForContentThumbsToLoad(): Promise<unknown[]> {
    return waitForThumbsToLoadInContainer(this.content);
  }

  public waitForPageThumbsToLoad(): Promise<unknown[]> {
    return waitForThumbsToLoadInContainer(document);
  }

  private usingColumnLayout(): boolean {
    return this.content.querySelector(COLUMN_SELECTOR) !== null;
  }
}
