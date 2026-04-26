import { DO_NOTHING } from "../../../../lib/environment/constants";
import { FavoriteItem } from "../../types/favorite_item";
import { FavoritesPageRequest } from "./favorites_page_request";

const QUEUE: FavoritesPageRequest[] = [];
let lastDequeuedPageNumber = -1;
let draining = false;
let onDequeue: (favorites: FavoriteItem[]) => void = DO_NOTHING;

const getSmallestEnqueuedPageNumber = (): number => QUEUE[0]?.pageNumber ?? Infinity;
const getNextPageNumberToDequeue = (): number => lastDequeuedPageNumber + 1;
const allPreviousPagesWereDequeued = (): boolean => getNextPageNumberToDequeue() === getSmallestEnqueuedPageNumber();
const isEmpty = (): boolean => QUEUE.length === 0;
const canDequeue = (): boolean => !isEmpty() && allPreviousPagesWereDequeued();

function sortByLowestPageNumber(): void {
  QUEUE.sort((request1, request2) => request1.pageNumber - request2.pageNumber);
}

function drain(): void {
  if (draining) {
    return;
  }
  draining = true;

  while (canDequeue()) {
    dequeue();
  }
  draining = false;
}

function dequeue(): void {
  lastDequeuedPageNumber += 1;
  const request = QUEUE.shift();
  const favorites = request?.favorites ?? [];

  onDequeue(favorites);
}

export function setDequeueCallback(callback: (favorites: FavoriteItem[]) => void): void {
  onDequeue = callback;
}

export function enqueue(request: FavoritesPageRequest): void {
  QUEUE.push(request);
  sortByLowestPageNumber();
  drain();
}
