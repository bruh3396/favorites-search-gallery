import { getItemsInContainer, getThumbsInMatrix } from "@/lib/ui/thumb/query";
import { COLUMN_SELECTOR } from "@/lib/ui/thumb/selectors";
import { Environment } from "@/app/context/environment";
import { div } from "@/utils/browser/element";
import { waitForThumbsToLoadInContainer } from "@/lib/ui/thumb/loading";

export class Shell {
  public readonly root = div("favorites-search-gallery");
  public readonly content = div("favorites-search-gallery-content");
  public readonly overlays = div("favorites-search-gallery-overlays");
  public readonly scrollSentinelTop = div("scroll-sentinel-top");
  public readonly scrollSentinelBottom = div("scroll-sentinel-bottom");

  constructor(environment: Environment) {
    if (environment.onMobileDevice) {
      this.root.dataset.mobile = "";
      this.lockViewport();
    }
    this.root.append(this.overlays);
  }

  public getContentThumbs(): HTMLElement[] {
    return this.usingColumnLayout() ? getThumbsInMatrix(this.content) : getItemsInContainer(this.content);
  }

  public getPageThumbs(): HTMLElement[] {
    return getItemsInContainer(document);
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

  private lockViewport(): void {
    const content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";
    const existing = document.querySelector<HTMLMetaElement>("meta[name=viewport]");
    const meta = existing ?? document.createElement("meta");

    meta.name = "viewport";
    meta.content = content;

    if (existing === null) {
      document.head.appendChild(meta);
    }
  }
}
