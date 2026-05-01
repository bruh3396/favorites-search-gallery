import { FavoriteItem } from "../../type/favorite_item";
import { FavoritesPageRequest } from "./favorites_page_request";

export class FavoritesFetchQueue {
  private readonly queue: FavoritesPageRequest[] = [];
  private lastDequeuedPageNumber = -1;
  private flushing = false;
  private onPageReady;

  constructor(onPageReady: (favorites: FavoriteItem[]) => void) {
    this.onPageReady = onPageReady;
  }

  private get headPageNumber(): number {
    return this.queue[0]?.pageNumber ?? Infinity;
  }

  private get nextInOrderPageNumber(): number {
    return this.lastDequeuedPageNumber + 1;
  }

  private get headPageIsNext(): boolean {
    return this.nextInOrderPageNumber === this.headPageNumber;
  }

  private get isEmpty(): boolean {
    return this.queue.length === 0;
  }

  private get canDequeue(): boolean {
    return !this.isEmpty && this.headPageIsNext;
  }

  public enqueue(request: FavoritesPageRequest): void {
    this.queue.push(request);
    this.sortByPageNumber();
    this.flushInOrder();
  }

  private sortByPageNumber(): void {
    this.queue.sort((request1, request2) => request1.pageNumber - request2.pageNumber);
  }

  private flushInOrder(): void {
    if (this.flushing) {
      return;
    }
    this.flushing = true;

    while (this.canDequeue) {
      this.dequeue();
    }
    this.flushing = false;
  }

  private dequeue(): void {
    this.lastDequeuedPageNumber += 1;
    const request = this.queue.shift();
    const favorites = request?.favorites ?? [];

    this.onPageReady(favorites);
  }
}
