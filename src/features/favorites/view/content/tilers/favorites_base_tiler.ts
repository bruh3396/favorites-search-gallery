import { FAVORITES_CONTENT_CONTAINER } from "../../../ui/structure/favorites_content_container";
import { FavoriteLayout } from "../../../../../types/common_types";
import { Skeleton } from "../skeleton/favorites_skeleton";
import { Tiler } from "./favorites_tiler_interface";
import { insertStyleHTML } from "../../../../../utils/dom/style";

export abstract class FavoritesBaseTiler implements Tiler {
  public container: HTMLElement;
  public abstract className: FavoriteLayout;
  public abstract skeletonStyle: Record<string, string>;

  constructor() {
    this.container = FAVORITES_CONTENT_CONTAINER;
  }

  public showSkeleton(): void {
    this.tile(new Skeleton(this.skeletonStyle).elements);
  }

  public tile(items: HTMLElement[]): void {
    const fragment = document.createDocumentFragment();

    for (const item of items) {
      fragment.appendChild(item);
    }
    this.container.innerHTML = "";
    this.container.appendChild(fragment);
  }

  public setColumnCount(columnCount: number): void {
    insertStyleHTML(`
        #favorites-search-gallery-content.${this.className} {
          grid-template-columns: repeat(${columnCount}, 1fr) !important;
        }
        `, `${this.className}-column-count`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setRowSize(rowSize: number): void { }

  public addItemsToTop(items: HTMLElement[]): void {
    for (const item of items.reverse()) {
      this.container.insertAdjacentElement("afterbegin", item);
    }
  }

  public addItemsToBottom(items: HTMLElement[]): void {
    for (const item of items) {
      this.container.appendChild(item);
    }
  }

  public abstract onActivate(): void;
  public abstract onDeactivate(): void;
}
