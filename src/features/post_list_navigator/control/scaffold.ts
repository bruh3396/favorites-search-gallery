import POST_LIST_CSS from "@/assets/css/post_list/post_list.css";
import SETTINGS_PANEL_CSS from "@/assets/css/favorites/settings_panel.css";
import { div } from "@/utils/browser/element";
import { insertStyle } from "@/utils/browser/injector";

export class PostListNavigatorScaffold {
  constructor(private readonly content: HTMLElement) {}

  public insert(): HTMLElement | null {
    this.insertContent();
    return this.insertOptionsMenu();
  }

  private insertOptionsMenu(): HTMLElement | null {
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

  private insertContent(): void {
    document.querySelector(".content")?.insertAdjacentElement("afterbegin", this.content);
  }
}
