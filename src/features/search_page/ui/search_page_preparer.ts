import { Events } from "../../../lib/communication/events";
import { ITEM_SELECTOR } from "../../../lib/dom/thumb";
import { prepareSearchPageThumbs } from "../model/search_page_thumb_preparer";
import { waitForAllThumbnailsToLoad } from "../../../lib/dom/content_thumb";
import { waitForDOMToLoad } from "../../../lib/ui/dom";

export async function prepareAllThumbsOnSearchPage(): Promise<void> {
  await waitForDOMToLoad();
  await waitForAllThumbnailsToLoad();
  const thumbs = Array.from(document.querySelectorAll(ITEM_SELECTOR)) as HTMLElement[];

  prepareSearchPageThumbs(thumbs);
  Events.searchPage.searchPageReady.emit();
}
