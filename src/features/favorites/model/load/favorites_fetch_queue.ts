import { DO_NOTHING } from "../../../../utils/misc/async";
import { FavoriteItem } from "../../types/favorite/favorite_item";
import { FavoritesPageRequest } from "./favorites_page_request";

const QUEUE: FavoritesPageRequest[] = [];
let lastDequeuedPage = -1;
let dequeuing = false;
let onDequeue: (favorites: FavoriteItem[]) => void = DO_NOTHING;

const getSmallestEnqueuedPageNumber = (): number => QUEUE[0].pageNumber;
const getNextPageNumberToDequeue = (): number => lastDequeuedPage + 1;
const allPreviousPagesWereDequeued = (): boolean => getNextPageNumberToDequeue() === getSmallestEnqueuedPageNumber();
const isEmpty = (): boolean => QUEUE.length === 0;
const canDequeue = (): boolean => !isEmpty() && allPreviousPagesWereDequeued();

function sortByLowestPageNumber(): void {
  QUEUE.sort((request1, request2) => request1.pageNumber - request2.pageNumber);
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
  lastDequeuedPage += 1;
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
