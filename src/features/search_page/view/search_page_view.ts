import * as ContentTiler from "../../../app/layout/content_tiler";
import * as SearchPageShell from "./shell/shell";
import { Preferences } from "../../../app/context/preferences";
import { getAllPageThumbs } from "../../../app/layout/content_thumbs";

export { render as renderSearchPage } from "./search_page_renderer";
export { addToBottom as insertNewSearchResults } from "../../../app/layout/content_tiler";
export { setInfiniteScrollStyle } from "./update/infinite_scroll_style";
export { markThumbAsFavorite, unmarkThumbAsFavorite } from "./update/thumb_favorite_marker";
export { setFavoriteIndicatorLoading } from "./update/favorite_indicator_loading_state";

export function setup(): Promise<void> {
  ContentTiler.setup();
  ContentTiler.tile(getAllPageThumbs());
  ContentTiler.hideUnusedLayoutSizer(Preferences.searchPageLayout.value);
  return SearchPageShell.setup();
}

export function currentSearch(): string {
  return (document.querySelector("input[name=\"tags\"]") as HTMLInputElement)?.value ?? "";
}
