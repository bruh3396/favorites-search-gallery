import * as FavoritesEta from "@/features/favorites/view/status/eta";
import { ProgressBar, buildProgressBar } from "@/lib/ui/widgets/progress_bar";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { NewFavoritesResult } from "@/features/favorites/types/types";
import { Root } from "@/app/layout/shell";
import { Timeout } from "@/types/async";
import { pluralSuffix } from "@/utils/pure/string";

let resultsCountIndicator: HTMLElement;
let statusIndicator: HTMLElement;
let progressBar: ProgressBar;
let totalFavoritesCount: number | null = null;
let statusTimeout: Timeout;
const TEMPORARY_STATUS_TIMEOUT = 1_000;

export function setStatus(text: string): void {
  clearTimeout(statusTimeout);
  statusIndicator.textContent = text;
}

export function setTemporaryStatus(text: string): void {
  setStatus(text);
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(clearStatus, TEMPORARY_STATUS_TIMEOUT);
}

export function setResultsCount(value: number): void {
  resultsCountIndicator.textContent = `${value} ${value === 1 ? "Result" : "Results"}`;
}

export function updateFetchStatus(completed: number, resultsCount: number): void {
  let statusText = `Fetching - ${completed}`;

  if (totalFavoritesCount !== null) {
    statusText = `${statusText} / ${totalFavoritesCount}`;
    const eta = FavoritesEta.getEta(completed, totalFavoritesCount);

    if (eta !== null) {
      statusText = `${statusText} - ${eta}`;
    }
    progressBar.setProgress(completed, totalFavoritesCount);
    progressBar.setVisible(true);
  }
  setStatus(statusText);
  setResultsCount(resultsCount);
}

export function notifyNewFavoritesFound(newFavorites: NewFavoritesResult): void {
  const newFavoritesCount = newFavorites.favorites.length;

  if (newFavoritesCount > 0) {
    setStatus(`Found ${newFavoritesCount} new favorite${pluralSuffix(newFavoritesCount)}`);
  }
}

export function setExpectedTotalFavoritesCount(count: number | null): void {
  totalFavoritesCount = count;
}

export function setup(): void {
  resultsCountIndicator = Root.querySelector(`#${FavoritesId.resultsCount}`) ?? document.createElement("label");
  statusIndicator = Root.querySelector(`#${FavoritesId.loadStatus}`) ?? document.createElement("label");
  progressBar = buildProgressBar(FavoritesId.loadProgressBar);
  Root.querySelector(`#${FavoritesId.toolbar}`)?.append(progressBar.element);
}

function clearStatus(): void {
  statusIndicator.textContent = "";
  progressBar.setVisible(false);
}
