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

const hasFailedRequests = (): boolean => FAILED_REQUESTS.length > 0;
const hasPendingRequests = (): boolean => PENDING_REQUEST_PAGE_NUMBERS.size > 0;
const allRequestsHaveStarted = (): boolean => fetchedAnEmptyPage;
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
    await sleep(200);
    return;
  }
  await fetchFavoritesPageHelper(request);
}

function fetchFavoritesPageHelper(request: FavoritesPageRequest): Promise<void> {
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

function onFavoritesPageRequestSuccess(request: FavoritesPageRequest, html: string): void {
  request.favorites = extractFavorites(html);
  populateMultipleMetadataFromAPI(request.favorites);
  PENDING_REQUEST_PAGE_NUMBERS.delete(request.realPageNumber);
  const favoritesPageIsEmpty = request.favorites.length === 0;

  fetchedAnEmptyPage ||= favoritesPageIsEmpty;

  if (!favoritesPageIsEmpty) {
    FavoritesFetchQueue.enqueue(request);
  }
}

function onFavoritesPageRequestError(request: FavoritesPageRequest, error: Error): void {
  console.error(error);
  request.retry();
  FAILED_REQUESTS.push(request);
}

function populateMultipleMetadataFromAPI(favorites: FavoriteItem[]): void {
  if (!FavoritesSettings.fetchMultiplePostWhileFetchingFavorites) {
    return;
  }
  const favoriteMap = Object.fromEntries(favorites.map(f => [f.id, f]));

  API.fetchMultiplePostsFromAPI(Object.keys(favoriteMap))
    .then((postMap) => {
      for (const [id, post] of Object.entries(postMap)) {
        favoriteMap[id].processPost(post);
      }
    })
    .catch(console.error);
}

function fetchNewFavoritesFromNextPage(): Promise<FavoriteItem[]> {
  return API.fetchFavoritesPage(getNewFetchRequest().realPageNumber)
    .then((html) => {
      const favorites = extractFavorites(html);
      return favorites.filter(favorite => !storedFavoriteIds.has(favorite.id));
    });
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

  await sleep(100);

  while (true) {
    const favorites = await fetchNewFavoritesFromNextPage();

    if (favorites.length === 0) {
      break;
    }
    populateMultipleMetadataFromAPI(favorites);
    allNewFavorites.push(...favorites);

    if (favorites.length < FAVORITES_PER_PAGE) {
      break;
    }
    await sleep(FavoritesSettings.favoritesPageFetchDelay);
  }
  storedFavoriteIds.clear();
  return allNewFavorites;
}
