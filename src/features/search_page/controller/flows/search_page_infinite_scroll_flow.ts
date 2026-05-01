import * as SearchPageModel from "../../model/search_page_model";
import * as SearchPageView from "../../view/search_page_view";
import { Events } from "../../../../lib/communication/events";
import { PageBottomObserver } from "../../../../lib/core/observers/page_bottom_observer";
import { Preferences } from "../../../../lib/preferences/preferences";

let pageBottomObserver: PageBottomObserver;

export function setupInfiniteScroll(): void {
  pageBottomObserver = new PageBottomObserver(showMoreResults);
  Events.searchPage.searchPageReady.on(() => {
    if (Preferences.searchPageInfiniteScroll.value) {
      pageBottomObserver.refresh();
    }
  }, { once: true });
}

export function disableInfiniteScroll(): void {
  pageBottomObserver.disconnect();
}

export function enableInfiniteScroll(): void {
  pageBottomObserver.refresh();
}

export async function showMoreResults(): Promise<boolean> {
  if (!Preferences.searchPageInfiniteScroll.value) {
    return false;
  }
  const moreResults = await SearchPageModel.getMoreResults();

  if (moreResults.length > 0 && Preferences.searchPageInfiniteScroll.value) {
    SearchPageView.insertNewSearchResults(moreResults);
    Events.searchPage.moreResultsAdded.emit(moreResults);
    pageBottomObserver.refresh();
    return true;
  }
  return false;
}
