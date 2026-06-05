import SEARCH_PAGE_INFINITE_SCROLL_CSS from "@/assets/css/search_page/infinite_scroll.css";
import { insertStyle } from "@/utils/dom/injector";

export function setInfiniteScrollStyle(value: boolean): void {
  insertStyle(value ? SEARCH_PAGE_INFINITE_SCROLL_CSS : "", "search-page-infinite-scroll");
}
