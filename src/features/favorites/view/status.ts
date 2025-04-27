import {API} from "../../../lib/api/api";
import {FAVORITES_SEARCH_GALLERY_CONTAINER} from "../../../lib/structure/container";
import {ON_MOBILE_DEVICE} from "../../../lib/functional/flags";
import {Timeout} from "../../../types/primitives/primitives";

let matchCountIndicator: HTMLElement | null = null;
let statusIndicator: HTMLElement | null = null;
let expectedTotalFavoritesCount: number | null = null;
let statusTimeout: Timeout;

function getMatchCountIndicator(): HTMLElement | null {
  if (matchCountIndicator === null) {
    matchCountIndicator = FAVORITES_SEARCH_GALLERY_CONTAINER.querySelector("#match-count-label");
  }
  return matchCountIndicator;
}

function getStatusIndicator(): HTMLElement | null {
  if (statusIndicator === null) {
    statusIndicator = FAVORITES_SEARCH_GALLERY_CONTAINER.querySelector("#favorites-load-status-label");
  }
  return statusIndicator;
}

function setStatus(text: string): void {
  const indicator = getStatusIndicator();

  if (indicator === null) {
    console.error("Status indicator is null");
    return;
  }
  indicator.textContent = text;
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => {
    indicator.textContent = "";
  }, 1500);
}

function setMatchCount(value: number): void {
  const indicator = getMatchCountIndicator();

  if (indicator === null) {
    console.error("Match count indicator is null");
    return;
  }
  indicator.textContent = `${value} ${value === 1 ? "Match" : "Matches"}`;
}

function updateStatusWhileFetching(searchResultsCount: number, favoritesFoundCount: number): void {
  const prefix = ON_MOBILE_DEVICE ? "" : "Favorites ";
  let statusText = `Fetching ${prefix}${favoritesFoundCount}`;

  if (expectedTotalFavoritesCount !== null) {
    statusText = `${statusText} / ${expectedTotalFavoritesCount}`;
  }
  setStatus(statusText);
  setMatchCount(searchResultsCount);
}

async function setExpectedTotalFavoritesCount(): Promise<void> {
  expectedTotalFavoritesCount = await API.getFavoritesCount();
}

function setup(): void {
  setExpectedTotalFavoritesCount();
}

export const FavoritesStatus = {
  setStatus,
  setMatchCount,
  updateStatusWhileFetching,
  setup
};
