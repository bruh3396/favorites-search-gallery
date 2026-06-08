import POST_LIST_INFINITE_SCROLL_CSS from "@/assets/css/post_list/infinite_scroll.css";
import { insertStyle } from "@/utils/dom/injector";

export function setInfiniteScrollStyle(value: boolean): void {
  insertStyle(value ? POST_LIST_INFINITE_SCROLL_CSS : "", "post-list-infinite-scroll");
}
