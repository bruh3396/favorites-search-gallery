import * as API from "../../../../lib/api/api";
import * as FavoritesFetchQueue from "./favorites_fetch_queue";
import { FavoriteItem } from "../../types/favorite/favorite_item";
import { FavoritesPageRequest } from "./favorites_page_request";
import { extractFavorites } from "./favorites_extractor";
import { sleep } from "../../../../utils/misc/async";

const PENDING_REQUEST_PAGE_NUMBERS = new Set<number>();
const FAILED_REQUESTS: FavoritesPageRequest[] = [];
let storedFavoriteIds = new Set<string>();
let currentPageNumber = 0;
let fetchedAnEmptyPage = false;

function hasFailedRequests(): boolean {
  return FAILED_REQUESTS.length > 0;
}

function hasPendingRequests(): boolean {
  return PENDING_REQUEST_PAGE_NUMBERS.size > 0;
}

function allRequestsHaveStarted(): boolean {
  return fetchedAnEmptyPage;
}

function someRequestsArePending(): boolean {
  return hasPendingRequests() || hasFailedRequests();
}

function noRequestsArePending(): boolean {
  return !someRequestsArePending();
}

function allRequestsHaveCompleted(): boolean {
  return allRequestsHaveStarted() && noRequestsArePending();
}

function someRequestsAreIncomplete(): boolean {
  return !allRequestsHaveCompleted();
}

function oldestFailedFetchRequest(): FavoritesPageRequest | null {
  return FAILED_REQUESTS.shift() ?? null;
}

function getNewFetchRequest(): FavoritesPageRequest {
  const request = new FavoritesPageRequest(currentPageNumber);

  PENDING_REQUEST_PAGE_NUMBERS.add(request.realPageNumber);
  currentPageNumber += 1;
  return request;
}

function nextFetchRequest(): FavoritesPageRequest | null {
  if (hasFailedRequests()) {
    return oldestFailedFetchRequest();
  }

  if (!allRequestsHaveStarted()) {
    return getNewFetchRequest();
  }
  return null;
}

async function fetchNextFavoritesPage(): Promise<void> {
  const request = nextFetchRequest();

  if (request === null) {
    await sleep(200);
    return;
  }
  await fetchFavoritesPageHelper(request);
}

async function fetchFavoritesPageHelper(request: FavoritesPageRequest): Promise<void> {
  API.fetchFavoritesPage(request.realPageNumber)
    .then((html) => {
      onFavoritesPageRequestSuccess(request, html);
    })
    .catch((error) => {
      onFavoritesPageRequestError(request, error);
    });
  await sleep(request.fetchDelay);
}

function onFavoritesPageRequestSuccess(request: FavoritesPageRequest, html: string): void {
  request.favorites = extractFavorites(html);
  PENDING_REQUEST_PAGE_NUMBERS.delete(request.realPageNumber);
  const favoritesPageIsEmpty = request.favorites.length === 0;

  fetchedAnEmptyPage = fetchedAnEmptyPage || favoritesPageIsEmpty;

  if (!favoritesPageIsEmpty) {
    FavoritesFetchQueue.enqueue(request);
  }
}

function onFavoritesPageRequestError(request: FavoritesPageRequest, error: Error): void {
  console.error(error);
  request.retry();
  FAILED_REQUESTS.push(request);
}

function fetchNewFavoritesOnReloadHelper(): Promise<{ allNewFavoritesFound: boolean, newFavorites: FavoriteItem[] }> {
  return API.fetchFavoritesPage(getNewFetchRequest().realPageNumber)
    .then((html) => {
      return extractNewFavorites(html);
    });
}

function extractNewFavorites(html: string): { allNewFavoritesFound: boolean, newFavorites: FavoriteItem[] } {
  const newFavorites = [];
  const fetchedFavorites = extractFavorites(html);
  let allNewFavoritesFound = fetchedFavorites.length === 0;

  for (const favorite of fetchedFavorites) {
    if (storedFavoriteIds.has(favorite.id)) {
      allNewFavoritesFound = true;
      break;
    }
    newFavorites.push(favorite);
  }
  return {
    allNewFavoritesFound,
    newFavorites
  };
}

export async function fetchAllFavorites(onFavoritesFound: (favorites: FavoriteItem[]) => void): Promise<void> {
  FavoritesFetchQueue.setDequeueCallback(onFavoritesFound);

  while (someRequestsAreIncomplete()) {
    await fetchNextFavoritesPage();
  }
}

export async function fetchNewFavoritesOnReload(ids: Set<string>): Promise<FavoriteItem[]> {
  await sleep(100);
  storedFavoriteIds = ids;
  let favorites: FavoriteItem[] = [];

  while (true) {
    const {allNewFavoritesFound, newFavorites} = await fetchNewFavoritesOnReloadHelper();

    favorites = favorites.concat(newFavorites);

    if (allNewFavoritesFound) {
      storedFavoriteIds.clear();
      return favorites;
    }
  }
}
