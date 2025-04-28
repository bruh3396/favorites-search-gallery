import {getSeededRandomPositiveIntegerInRange, roundToTwoDecimalPlaces} from "../../../../utils/primitive/number";
import {FAVORITES_CONTENT_CONTAINER} from "../../page_builder/content";
import {FavoriteLayout} from "../../../../types/primitives/primitives";
import {FavoritesSettings} from "../../../../config/favorites_settings";
import {ITEM_CLASS_NAME} from "../../../../utils/dom/dom";
import {Preferences} from "../../../../store/preferences/preferences";
import {Tiler} from "./tiler";
import {getNextAspectRatio} from "../aspect_ratios";
import {insertStyleHTML} from "../../../../utils/dom/style";

export abstract class FavoritesBaseTiler implements Tiler {
  public container: HTMLElement;
  public abstract className: FavoriteLayout;

  protected createSkeletonItem(): HTMLElement {
    const skeletonItem = document.createElement("div");
    const animationDelay = roundToTwoDecimalPlaces(Math.random() * 0.75);
    const animationDuration = roundToTwoDecimalPlaces((Math.random()) + 0.75);
    const aspectRatio = getNextAspectRatio() || `10/${getSeededRandomPositiveIntegerInRange(5, 20)}`;

    skeletonItem.style.aspectRatio = aspectRatio;

    if (FavoritesSettings.randomSkeletonAnimationTiming) {
      skeletonItem.style.setProperty("--skeleton-animation-delay", `${animationDelay}s`);
      skeletonItem.style.setProperty("--skeleton-animation-duration", `${animationDuration}s`);
    }
    skeletonItem.className = `skeleton-item ${ITEM_CLASS_NAME} ${FavoritesSettings.skeletonAnimationClasses}`;
    return skeletonItem;
  }

  private createSkeletonItems(): HTMLElement[] {
    const skeletonItems = [];
    const itemCount = Math.min(Preferences.resultsPerPage.value, 50);

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
