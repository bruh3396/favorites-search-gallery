import {Events} from "../../../lib/functional/events";

export interface SidebarItemOptions {
  title: string
  icon: string
  drawerHTML?: string
  onclick?: (event: MouseEvent) => void
  hotkey?: string
}

export class SidebarItem {
  public container: HTMLElement;
  public drawerContent: HTMLElement | null;

  get active(): boolean {
    return this.container.classList.contains("active");
  }

  constructor(options: SidebarItemOptions) {
    this.container = document.createElement("li");
    this.drawerContent = null;

    if (options.drawerHTML !== undefined) {
      this.drawerContent = document.createElement("div");
      this.drawerContent.innerHTML = options.drawerHTML;
    }
    const anchor = document.createElement("a");

    this.container.title = options.title;
    this.container.appendChild(anchor);
    anchor.innerHTML = options.icon;
    Events.global.keydown.on((event) => {
      const invalidEvent = !event.isHotkey ||
        options.hotkey === undefined ||
        event.key.toLowerCase() !== options.hotkey.toLowerCase();

      if (invalidEvent) {
        return;
      }
      this.container.click();
    });

    this.container.addEventListener("click", (event) => {
      if (options.onclick !== undefined) {
        options.onclick(event);
      }
    });
  }

  public activate(): void {
    this.container.classList.add("active");
  }

  public deactivate(): void {
    this.container.classList.remove("active");
  }
}
