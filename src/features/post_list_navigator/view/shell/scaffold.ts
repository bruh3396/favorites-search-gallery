import * as PostListNavigatorMenu from "@/features/post_list_navigator/view/shell/menu";
import { Content } from "@/app/layout/shell";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import POST_LIST_CSS from "@/assets/css/post_list/post_list.css";
import { insertStyle } from "@/utils/dom/injector";

export function insert(): void {
  insertOptionsMenu();
  insertContent();
}

function insertOptionsMenu(): void {
  const displayOptions = document.getElementById("displayOptions");

  if (displayOptions === null) {
    return;
  }
  const listItem = document.createElement("li");

  displayOptions.appendChild(listItem);
  insertStyle(POST_LIST_CSS);
  listItem.append(PostListNavigatorMenu.build());

  if (ON_MOBILE_DEVICE) {
    insertStyle(`#post-list-upscale-thumbs {
      display: none;
    }`);
  }
}

function insertContent(): void {
  document.querySelector(".content")?.insertAdjacentElement("afterbegin", Content);
}
