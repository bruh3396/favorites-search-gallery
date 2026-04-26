import * as API from "../../../../lib/server/fetch/api";
import * as FavoritesFetchQueue from "./favorites_fetch_queue";
import { FavoriteItem } from "../../types/favorite_item";
import { FavoritesPageRequest } from "./favorites_page_request";
import { extractFavorites } from "./favorites_extractor";
import { sleep } from "../../../../lib/core/async/promise";

const PENDING_REQUEST_PAGE_NUMBERS = new Set<number>();
const FAILED_REQUESTS: FavoritesPageRequest[] = [];
const PENDING_REQUESTS_POLL_INTERVAL = 200;
let currentPageNumber = 0;
let finalPageWasFetched = false;

const hasFailedRequests = (): boolean => FAILED_REQUESTS.length > 0;
const hasPendingRequests = (): boolean => PENDING_REQUEST_PAGE_NUMBERS.size > 0;
const allRequestsHaveStarted = (): boolean => finalPageWasFetched;
const someRequestsArePending = (): boolean => hasPendingRequests() || hasFailedRequests();
const noRequestsArePending = (): boolean => !someRequestsArePending();
const allRequestsHaveCompleted = (): boolean => allRequestsHaveStarted() && noRequestsArePending();
const someRequestsAreIncomplete = (): boolean => !allRequestsHaveCompleted();

function getNewFetchRequest(): FavoritesPageRequest {
  const request = new FavoritesPageRequest(currentPageNumber);

  PENDING_REQUEST_PAGE_NUMBERS.add(request.realPageNumber);
  currentPageNumber += 1;
  return request;
}

function nextFetchRequest(): FavoritesPageRequest | undefined {
  if (hasFailedRequests()) {
    return FAILED_REQUESTS.shift();
  }

  if (!allRequestsHaveStarted()) {
    return getNewFetchRequest();
  }
  return undefined;
}

async function fetchNextFavoritesPage(): Promise<void> {
  const request = nextFetchRequest();

  if (request === undefined) {
    await sleep(PENDING_REQUESTS_POLL_INTERVAL);
    return;
  }
  await fetchFavoritesPage(request);
}

function fetchFavoritesPage(request: FavoritesPageRequest): Promise<void> {
  return sleep(request.fetchDelay).then(() => {
    API.fetchFavoritesPage(request.realPageNumber)
      .then((html) => {
        onFavoritesPageRequestSuccess(request, html);
      })
      .catch((error) => {
        onFavoritesPageRequestError(request, error);
      });
  });
}

function handleFetchedPage(request: FavoritesPageRequest): void {
  const favoritesPageIsEmpty = request.favorites.length === 0;

  finalPageWasFetched ||= favoritesPageIsEmpty;

  if (!favoritesPageIsEmpty) {
    FavoritesFetchQueue.enqueue(request);
  }
}

function onFavoritesPageRequestSuccess(request: FavoritesPageRequest, html: string): void {
  request.favorites = extractFavorites(html);
  API.populateMetadata(request.favorites);
  PENDING_REQUEST_PAGE_NUMBERS.delete(request.realPageNumber);
  handleFetchedPage(request);
}

function onFavoritesPageRequestError(request: FavoritesPageRequest, error: Error): void {
  console.error(error);
  request.retry();
  FAILED_REQUESTS.push(request);
}

export async function fetchAllFavorites(onFavoritesFound: (favorites: FavoriteItem[]) => void): Promise<void> {
  FavoritesFetchQueue.setDequeueCallback(onFavoritesFound);

  while (someRequestsAreIncomplete()) {
    await fetchNextFavoritesPage();
  }
}
