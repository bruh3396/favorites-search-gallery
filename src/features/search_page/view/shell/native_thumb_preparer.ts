import { ITEM_SELECTOR } from "@/lib/thumb/thumbs";
import { prepareSearchPageThumbs } from "@/features/search_page/dom_tweaks/thumb_preparer";
import { waitForAllThumbnailsToLoad } from "@/app/layout/content_thumbs";
import { waitForDomToLoad } from "@/app/input/dom_events";

export async function prepareNativeSearchPageThumbs(): Promise<void> {
  await waitForDomToLoad();
  await waitForAllThumbnailsToLoad();
  prepareSearchPageThumbs(Array.from(document.querySelectorAll(ITEM_SELECTOR)));
}
