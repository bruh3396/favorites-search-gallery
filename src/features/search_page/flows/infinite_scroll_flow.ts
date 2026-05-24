import * as SearchPageModel from "../model/search_page_model";
import * as SearchPageView from "../view/search_page_view";
import { Events } from "../../../app/channels/events";
import { PageBottomObserver } from "../../../lib/observer/page_bottom_observer";
import { Preferences } from "../../../app/context/preferences";

const pageBottomObserver: PageBottomObserver = new PageBottomObserver(showMoreResults);

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
