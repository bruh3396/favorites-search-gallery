import { div, insertInto } from "@/utils/browser/element";
import { Shell } from "@/app/context/shell";

export class PostListNavigatorShell {
  public readonly menu: HTMLElement;

  constructor(shell: Shell) {
    const menuItem = document.createElement("li");

    this.menu = div("post-list-menu");
    menuItem.append(this.menu);
    insertInto(".content", "afterbegin", shell.content);
    insertInto("#displayOptions", "beforeend", menuItem);
  }
}
