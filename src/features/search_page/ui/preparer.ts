import { Events } from "../../../lib/communication/events";
import { ITEM_SELECTOR } from "../../../lib/dom/thumb";
import { prepareSearchPageThumbs } from "../model/thumb_preparer";
import { waitForAllThumbnailsToLoad } from "../../../lib/dom/content_thumb";
import { waitForDomToLoad } from "../../../lib/ui/dom";

export async function prepareAllThumbsOnSearchPage(): Promise<void> {
  await waitForDomToLoad();
  await waitForAllThumbnailsToLoad();
  const thumbs = Array.from(document.querySelectorAll(ITEM_SELECTOR)) as HTMLElement[];

  prepareSearchPageThumbs(thumbs);
  Events.searchPage.searchPageReady.emit();
}
