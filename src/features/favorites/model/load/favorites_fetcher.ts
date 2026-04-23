import * as API from "../../../../lib/api/api";
import * as FavoritesFetchQueue from "./favorites_fetch_queue";
import { FAVORITES_PER_PAGE } from "../../../../lib/global/constants";
import { FavoriteItem } from "../../types/favorite/favorite_item";
import { FavoritesPageRequest } from "./favorites_page_request";
import { FavoritesSettings } from "../../../../config/favorites_settings";
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
  await sleep(request.fetchDelay);
  API.fetchFavoritesPage(request.realPageNumber)
    .then((html) => {
      onFavoritesPageRequestSuccess(request, html);
    })
    .catch((error) => {
      onFavoritesPageRequestError(request, error);
    });
}

function onFavoritesPageRequestSuccess(request: FavoritesPageRequest, html: string): void {
  request.favorites = extractFavorites(html);
  populateMultipleMetadataFromAPI(request.favorites);
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

async function populateMultipleMetadataFromAPI(favorites: FavoriteItem[]): Promise<void> {
  if (!FavoritesSettings.fetchMultiplePostWhileFetchingFavorites) {
    return;
  }
  const favoriteMap = favorites.reduce((map, favorite) => {
    map[favorite.id] = favorite;
    return map;
  }, {} as Record<string, FavoriteItem>);
  const postMap = await API.fetchMultiplePostsFromAPI(Array.from(Object.keys(favoriteMap)));

  for (const [id, post] of Object.entries(postMap)) {
    favoriteMap[id].processPost(post);
  }
}

export async function fetchAllFavorites(onFavoritesFound: (favorites: FavoriteItem[]) => void): Promise<void> {
  FavoritesFetchQueue.setDequeueCallback(onFavoritesFound);

  while (someRequestsAreIncomplete()) {
    await fetchNextFavoritesPage();
  }
}

export async function fetchNewFavoritesOnReload(ids: Set<string>): Promise<FavoriteItem[]> {
  storedFavoriteIds = ids;
  const allNewFavorites: FavoriteItem[] = [];
  let favorites: FavoriteItem[];
  let moreNewPagesExist;

  await sleep(100);
  do {
    favorites = await fetchNewFavoritesFromNextPage();

    if (favorites.length === 0) {
      break;
    }
    moreNewPagesExist = favorites.length === FAVORITES_PER_PAGE;
    populateMultipleMetadataFromAPI(favorites);
    allNewFavorites.push(...favorites);

    if (moreNewPagesExist) {
      await sleep(FavoritesSettings.favoritesPageFetchDelay);
    }
  } while (moreNewPagesExist);
  storedFavoriteIds.clear();
  return allNewFavorites;
}

function fetchNewFavoritesFromNextPage(): Promise<FavoriteItem[]> {
  return API.fetchFavoritesPage(getNewFetchRequest().realPageNumber)
    .then((html) => {
      const favorites = extractFavorites(html);
      return favorites.filter(favorite => !storedFavoriteIds.has(favorite.id));
    });
}
