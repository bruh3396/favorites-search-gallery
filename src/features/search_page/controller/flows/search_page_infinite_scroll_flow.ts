import * as SearchPageModel from "../../model/search_page_model";
import * as SearchPageView from "../../view/search_page_view";
import { Events } from "../../../../lib/global/events/events";
import { PageBottomObserver } from "../../../../lib/components/page_bottom_observer";
import { Preferences } from "../../../../lib/global/preferences/preferences";

let pageBottomObserver: PageBottomObserver;

export function setupInfiniteScroll(): void {
  pageBottomObserver = new PageBottomObserver(showMoreResults);
  Events.searchPage.searchPageReady.on(() => {
    if (Preferences.searchPageInfiniteScrollEnabled.value) {
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

export async function showMoreResults(): Promise<void> {
  if (!Preferences.searchPageInfiniteScrollEnabled.value) {
    return;
  }
  const moreResults = await SearchPageModel.getMoreResults();

  if (moreResults.length > 0 && Preferences.searchPageInfiniteScrollEnabled.value) {
    SearchPageView.insertNewSearchResults(moreResults);
    Events.searchPage.moreResultsAdded.emit(moreResults);
    pageBottomObserver.refresh();
  }
}
