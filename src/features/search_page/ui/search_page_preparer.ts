import { getAllThumbs, waitForAllThumbnailsToLoad, waitForDOMToLoad } from "../../../utils/dom/dom";
import { Events } from "../../../lib/communication/events";
import { prepareSearchPageThumbs } from "../../../utils/search_page_utils";

export async function prepareAllThumbsOnSearchPage(): Promise<void> {
  await waitForDOMToLoad();
  await waitForAllThumbnailsToLoad();
  const thumbs = getAllThumbs();

  prepareSearchPageThumbs(thumbs);
  Events.searchPage.searchPageReady.emit();
}
