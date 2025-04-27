import {FAVORITES_CONTENT_CONTAINER} from "../../page_builder/structure";
import {FavoriteLayout} from "../../../../types/primitives/primitives";
import {ITEM_CLASS_NAME} from "../../../../utils/dom/dom";
import {Preferences} from "../../../../store/preferences/preferences";
import {Tiler} from "./interfaces";
import {insertStyleHTML} from "../../../../utils/dom/style";

export abstract class FavoritesBaseTiler implements Tiler {
  public container: HTMLElement;
  public abstract className: FavoriteLayout;

  protected createSkeletonItem(): HTMLElement {
    const skeletonItem = document.createElement("div");

    skeletonItem.classList.add("skeleton-item");
    skeletonItem.classList.add(ITEM_CLASS_NAME);
    skeletonItem.classList.add("shine");
    return skeletonItem;
  }

  private createSkeletonItems(): HTMLElement[] {
    const skeletonItems = [];
    const itemCount = Math.min(Preferences.resultsPerPage.value, 100);

    for (let i = 0; i < itemCount; i += 1) {
      skeletonItems.push(this.createSkeletonItem());
    }
    return skeletonItems;
  }

  public showSkeleton(): void {
    this.tile(this.createSkeletonItems());
  }

  constructor() {
    this.container = FAVORITES_CONTENT_CONTAINER;
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
  public setRowSize(rowSize: number): void {
  }
  public abstract onActivation(): void;
  public abstract onDeactivation(): void;

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
}
