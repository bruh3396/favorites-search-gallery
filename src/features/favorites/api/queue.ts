import {FavoritesPageRequest} from "./request";
import {doNothing} from "../../../config/constants";

const queue: FavoritesPageRequest[] = [];
let mostRecentlyDequeuedPageNumber = -1;
let dequeuing = false;
let onDequeue: (request: FavoritesPageRequest) => void = doNothing;

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
  onDequeue(queue.shift() as FavoritesPageRequest);
}

function setDequeueCallback(callback: (request: FavoritesPageRequest) => void): void {
  onDequeue = callback;
}

function enqueue(request: FavoritesPageRequest): void {
  queue.push(request);
  sortByLowestPageNumber();
  drain();
}

const fetchQueue = {
  setDequeueCallback,
  enqueue
};

export default fetchQueue;
