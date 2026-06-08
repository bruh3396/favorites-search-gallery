import * as PostListNavigatorModel from "@/features/post_list_navigator/model/post_list_navigator_model";
import * as PostListNavigatorView from "@/features/post_list_navigator/view/post_list_navigator_view";
import { Events } from "@/app/channels/events";
import { PageBottomObserver } from "@/lib/observer/page_bottom_observer";
import { Preferences } from "@/app/context/preferences";

const pageBottomObserver: PageBottomObserver = new PageBottomObserver(showMoreResults);

export function disableInfiniteScroll(): void {
  pageBottomObserver.disconnect();
}

export function enableInfiniteScroll(): void {
  pageBottomObserver.refresh();
}

export async function showMoreResults(): Promise<boolean> {
  if (!Preferences.postListInfiniteScroll.value) {
    return false;
  }
  const moreResults = await PostListNavigatorModel.getMoreResults();

  if (moreResults.length > 0 && Preferences.postListInfiniteScroll.value) {
    PostListNavigatorView.insertNewSearchResults(moreResults);
    Events.postList.moreResultsAdded.emit(moreResults);
    pageBottomObserver.refresh();
    return true;
  }
  return false;
}
