import * as API from "../../../../lib/api/api";
import { FAVORITES_SEARCH_GALLERY_CONTAINER } from "../../../../lib/global/container";
import { ON_MOBILE_DEVICE } from "../../../../lib/global/flags/intrinsic_flags";
import { Timeout } from "../../../../types/primitives/primitives";
import { getFavoritesPageId } from "../../../../utils/misc/favorites_page_metadata";

let matchCountIndicator: HTMLElement;
let statusIndicator: HTMLElement;
let expectedTotalFavoritesCount: number | null = null;
let statusTimeout: Timeout;
const TEMPORARY_STATUS_TIMEOUT = 1000;
const FETCHING_STATUS_PREFIX = ON_MOBILE_DEVICE ? "" : "Favorites ";

export function setStatus(text: string): void {
  statusIndicator.classList.remove("hidden");
  statusIndicator.textContent = text;
}

export function clearStatus(): void {
  statusIndicator.textContent = "";
  statusIndicator.classList.add("hidden");
}

export function setTemporaryStatus(text: string): void {
  setStatus(text);
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(clearStatus, TEMPORARY_STATUS_TIMEOUT);
}

export function setMatchCount(value: number): void {
  matchCountIndicator.textContent = `${value} ${value === 1 ? "Result" : "Results"}`;
}

export function updateStatusWhileFetching(searchResultsCount: number, favoritesFoundCount: number): void {
  let statusText = `Fetching ${FETCHING_STATUS_PREFIX}${favoritesFoundCount}`;

  if (expectedTotalFavoritesCount !== null) {
    statusText = `${statusText} / ${expectedTotalFavoritesCount}`;
  }
  setStatus(statusText);
  setMatchCount(searchResultsCount);
}

export function notifyNewFavoritesFound(newFavoritesCount: number): void {
  if (newFavoritesCount > 0) {
    setStatus(`Found ${newFavoritesCount} new favorite${newFavoritesCount > 1 ? "s" : ""}`);
  }
}

 async function setExpectedTotalFavoritesCount(): Promise<void> {
  expectedTotalFavoritesCount = await API.getFavoritesCount(getFavoritesPageId() ?? "");
}

export function setupFavoritesStatus(): void {
  setExpectedTotalFavoritesCount();
  matchCountIndicator = FAVORITES_SEARCH_GALLERY_CONTAINER.querySelector("#match-count-label") ?? document.createElement("label");
  statusIndicator = FAVORITES_SEARCH_GALLERY_CONTAINER.querySelector("#favorites-load-status-label") ?? document.createElement("label");
}
