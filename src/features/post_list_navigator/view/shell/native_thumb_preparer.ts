import { ITEM_SELECTOR } from "@/lib/thumb/thumbs";
import { preparePostListThumbs } from "@/features/post_list_navigator/dom_tweaks/thumb_preparer";
import { waitForAllThumbsToLoad } from "@/app/layout/content_thumbs";
import { waitForDomToLoad } from "@/app/dom/ready";

export async function prepareNativePostListThumbs(): Promise<void> {
  await waitForDomToLoad();
  await waitForAllThumbsToLoad();
  preparePostListThumbs(Array.from(document.querySelectorAll(ITEM_SELECTOR)));
}
