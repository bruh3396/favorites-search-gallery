import { Content } from "@/app/layout/shell";
import POST_LIST_CSS from "@/assets/css/post_list/post_list.css";
import SETTINGS_PANEL_CSS from "@/assets/css/favorites/settings_panel.css";
import { div } from "@/utils/browser/factory";
import { insertStyle } from "@/utils/browser/injector";

export function insert(): HTMLElement | null {
  insertContent();
  return insertOptionsMenu();
}

function insertOptionsMenu(): HTMLElement | null {
  const displayOptions = document.getElementById("displayOptions");

  if (displayOptions === null) {
    return null;
  }
  const listItem = document.createElement("li");
  const panel = div("post-list-menu");

  insertStyle(POST_LIST_CSS + SETTINGS_PANEL_CSS, "post-list-ui");
  listItem.appendChild(panel);
  displayOptions.appendChild(listItem);
  return panel;
}

function insertContent(): void {
  document.querySelector(".content")?.insertAdjacentElement("afterbegin", Content);
}
