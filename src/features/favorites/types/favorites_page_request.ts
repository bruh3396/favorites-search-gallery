import { FAVORITES_PER_PAGE } from "../../../lib/rule34_constants";
import { Rule34NetworkConfig } from "../../../config/rule34_network_config";

export class FavoritesPageRequest {
  public readonly pageNumber: number;
  public elements: HTMLElement[] = [];
  private retryCount = 0;

  constructor(pageNumber: number) {
    this.pageNumber = pageNumber;
  }

  public get fetchDelay(): number {
    return (Rule34NetworkConfig.favoritesPageRetryBackoffBase ** (this.retryCount)) + Rule34NetworkConfig.favoritesPageFetchDelay;
  }

  public get realPageNumber(): number {
    return this.pageNumber * FAVORITES_PER_PAGE;
  }

  public complete(elements: HTMLElement[]): void {
    this.elements = elements;
  }

  public retry(): void {
    this.retryCount += 1;
  }
}
