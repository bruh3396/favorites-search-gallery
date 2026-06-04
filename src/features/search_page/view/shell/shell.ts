import * as SearchPageDesktopMenu from "@/features/search_page/control/desktop_menu";
import * as SearchPageNativeThumbPreparer from "@/features/search_page/view/shell/native_thumb_preparer";
import * as SearchPageOptionVisibility from "@/features/search_page/view/shell/option_visibility";
import * as SearchPageScaffold from "@/features/search_page/view/shell/scaffold";

export function create(): Promise<void> {
  SearchPageScaffold.setup();
  SearchPageOptionVisibility.hideUnusedOptions();
  SearchPageDesktopMenu.create();
  return SearchPageNativeThumbPreparer.prepareNativeSearchPageThumbs();
}
