import * as SearchPageDesktopMenu from "../../control/desktop_menu";
import * as SearchPageNativeThumbPreparer from "./native_thumb_preparer";
import * as SearchPageOptionVisibility from "./option_visibility";
import * as SearchPageScaffold from "./scaffold";

export function create(): Promise<void> {
  SearchPageScaffold.setup();
  SearchPageOptionVisibility.hideUnusedOptions();
  SearchPageDesktopMenu.create();
  return SearchPageNativeThumbPreparer.prepareNativeSearchPageThumbs();
}
