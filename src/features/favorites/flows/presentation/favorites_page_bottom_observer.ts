import {FAVORITES_CONTENT_CONTAINER} from "../../setup/page_builder/favorites_content_container";
import {FavoritesSettings} from "../../../../config/favorites_settings";
import {ITEM_CLASS_NAME} from "../../../../utils/dom/dom";

export class FavoritesPageBottomObserver {
  private intersectionObserver: IntersectionObserver;
  private onBottomReached: () => void;

  constructor(onBottomReached: () => void) {
    this.onBottomReached = onBottomReached;
    this.intersectionObserver = this.createIntersectionObserver();
  }

  public disconnect(): void {
    this.intersectionObserver.disconnect();
  }

  public refresh(): void {
    this.disconnect();
    this.observeBottomElements();
  }

  private createIntersectionObserver(): IntersectionObserver {
    return new IntersectionObserver(this.onIntersectionChanged.bind(this), {
      threshold: [0.1],
      rootMargin: `0% 0% ${FavoritesSettings.infiniteScrollMargin} 0%`
    });
  }

  private observeBottomElements(): void {
    const bottomElements = Array.from(FAVORITES_CONTENT_CONTAINER.querySelectorAll(`.${ITEM_CLASS_NAME}:last-child`));

    for (const element of bottomElements) {
      this.intersectionObserver.observe(element);
    }
  }

  private onIntersectionChanged(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.onBottomReached();
        this.disconnect();
        return;
      }
    }
  }
}
