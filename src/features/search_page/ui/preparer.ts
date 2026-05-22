import { Events } from "../../../app/messaging/events";
import { ITEM_SELECTOR } from "../../../lib/thumb/thumbs";
import { prepareSearchPageThumbs } from "../model/thumb_preparer";
import { waitForAllThumbnailsToLoad } from "../../../app/shell/content_thumbs";
import { waitForDomToLoad } from "../../../app/input/dom_events";

export async function prepareAllThumbsOnSearchPage(): Promise<void> {
  await waitForDomToLoad();
  await waitForAllThumbnailsToLoad();
  const thumbs = Array.from(document.querySelectorAll(ITEM_SELECTOR)) as HTMLElement[];

  prepareSearchPageThumbs(thumbs);
  Events.searchPage.searchPageReady.emit();
}
