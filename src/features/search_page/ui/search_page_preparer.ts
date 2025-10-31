import { getAllThumbs, waitForAllThumbnailsToLoad, waitForDOMToLoad } from "../../../utils/dom/dom";
import { Events } from "../../../lib/global/events/events";
import { prepareSearchPageThumbs } from "../../../utils/misc/search_page_utils";

export async function prepareAllThumbsOnSearchPage(): Promise<void> {
  await waitForDOMToLoad();
  await waitForAllThumbnailsToLoad();
  const thumbs = getAllThumbs();

  prepareSearchPageThumbs(thumbs);
  Events.searchPage.searchPageReady.emit();
}
