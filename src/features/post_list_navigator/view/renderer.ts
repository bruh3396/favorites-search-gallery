import * as ContentTiler from "@/app/layout/content_tiler";
import { POSTS_PER_POST_LIST_PAGE } from "@/lib/rule34_constants";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";

export function render(postList: PostList): void {
  ContentTiler.tile(postList.thumbs);
  updatePaginator(postList);
  updateAddressBar(postList);
}

function updatePaginator(postList: PostList): void {
  if (postList.paginator === null) {
    return;
  }
  const currentPaginator = document.getElementById("paginator");

  if (currentPaginator === null || currentPaginator === postList.paginator) {
    return;
  }
  currentPaginator.insertAdjacentElement("afterend", postList.paginator);
  currentPaginator.remove();
}

function updateAddressBar(postList: PostList): void {
  const baseUrl = location.origin + location.pathname;
  const searchFragment = `${location.search.replace(/&pid=\d+/g, "")}&pid=${postList.pageNumber * POSTS_PER_POST_LIST_PAGE}`;

  window.history.replaceState(null, "", baseUrl + searchFragment);
}
