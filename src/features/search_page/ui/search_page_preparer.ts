import { getAllThumbs, waitForAllThumbnailsToLoad, waitForDOMToLoad } from "../../../utils/dom/dom";
import { Events } from "../../../lib/global/events/events";
import { prepareSearchPageThumbs } from "../../../types/search_page";

export async function prepareAllThumbsOnSearchPage(): Promise<void> {
  await waitForDOMToLoad();
  await waitForAllThumbnailsToLoad();
  const thumbs = getAllThumbs();

  prepareSearchPageThumbs(thumbs);
  Events.searchPage.searchPageReady.emit();
}
