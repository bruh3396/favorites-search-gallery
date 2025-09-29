import { DO_NOTHING } from "../../../../utils/misc/async";
import { FavoriteItem } from "../../types/favorite/favorite_item";
import { FavoritesPageRequest } from "./favorites_page_request";

const queue: FavoritesPageRequest[] = [];
let mostRecentlyDequeuedPageNumber = -1;
let dequeuing = false;
let onDequeue: (favorites: FavoriteItem[]) => void = DO_NOTHING;

function getSmallestEnqueuedPageNumber(): number {
  return queue[0].pageNumber;
}

function getNextPageNumberToDequeue(): number {
  return mostRecentlyDequeuedPageNumber + 1;
}

function allPreviousPagesWereDequeued(): boolean {
  return getNextPageNumberToDequeue() === getSmallestEnqueuedPageNumber();
}

function isEmpty(): boolean {
  return queue.length === 0;
}

function canDequeue(): boolean {
  return !isEmpty() && allPreviousPagesWereDequeued();
}

function sortByLowestPageNumber(): void {
  queue.sort((request1, request2) => request1.pageNumber - request2.pageNumber);
}

function drain(): void {
  if (dequeuing) {
    return;
  }
  dequeuing = true;

  while (canDequeue()) {
    dequeue();
  }
  dequeuing = false;
}

function dequeue(): void {
  mostRecentlyDequeuedPageNumber += 1;
  const request = queue.shift();
  const favorites = request?.favorites ?? [];

  onDequeue(favorites);
}

export function setDequeueCallback(callback: (favorites: FavoriteItem[]) => void): void {
  onDequeue = callback;
}

export function enqueue(request: FavoritesPageRequest): void {
  queue.push(request);
  sortByLowestPageNumber();
  drain();
}
