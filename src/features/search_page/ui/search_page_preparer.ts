import { waitForDOMToLoad } from "../../../lib/ui/dom";
import { waitForAllThumbnailsToLoad } from "../../../utils/dom/thumb";
import { getAllThumbs } from "../../../utils/dom/thumb";
import { Events } from "../../../lib/events/events";
import { prepareSearchPageThumbs } from "../model/search_page_thumb_preparer";

export async function prepareAllThumbsOnSearchPage(): Promise<void> {
  await waitForDOMToLoad();
  await waitForAllThumbnailsToLoad();
  const thumbs = getAllThumbs();

  prepareSearchPageThumbs(thumbs);
  Events.searchPage.searchPageReady.emit();
}
