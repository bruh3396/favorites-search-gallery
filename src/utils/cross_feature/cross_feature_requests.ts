import { EventEmitter } from "../../lib/components/event_emitter";
import { NavigationKey } from "../../types/common_types";
import { SearchPage } from "../../types/search_page";

export class CrossFeatureRequest<K, L> {
  private responseEvent = new EventEmitter<K>(true);
  private requestEvent = new EventEmitter<L>(true);
  private defaultValue: K;
  private timeout: number;

  constructor(timeout: number, defaultValue: K) {
    this.timeout = timeout;
    this.defaultValue = defaultValue;
  }

  public request(value: L): Promise<K> {
    return new Promise((resolve) => {
      this.responseEvent.timeout(this.timeout)
      .then((result) => resolve(result))
      .catch(() => resolve(this.defaultValue));
      this.requestEvent.emit(value);
    });
  }

  public setResponse(func: (value: L) => K): void {
    this.requestEvent.on((value) => {
      this.responseEvent.emit(func(value));
    });
  }
}

export const CrossFeatureRequests = {
  infiniteScroll: new CrossFeatureRequest<boolean, void>(10, false),
  inGallery: new CrossFeatureRequest<boolean, void>(10, false),
  loadNewSearchPagesInGallery: new CrossFeatureRequest<SearchPage | null, NavigationKey>(10, null),
  loadNewFavoritesInGallery: new CrossFeatureRequest<boolean, NavigationKey>(1000, false)
};
