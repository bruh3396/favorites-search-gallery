import * as Icons from "../../../assets/icons";
import {FAVORITES_SEARCH_GALLERY_CONTAINER} from "../../../lib/structure/container";
import {SIDEBAR_HTML} from "../../../assets/html";
import {SidebarItem} from "./sidebar_item";
import {getItemCount} from "../../../utils/dom/dom";
import {insertStyleHTML} from "../../../utils/dom/style";

class HorizontalDrawer {
  public container: HTMLElement;

  public get opened(): boolean {
    return this.container.classList.contains("open");
  }

  constructor(parent: HTMLElement) {
    this.container = document.createElement("div");

    this.container.classList.add("horizontal-drawer");
    parent.appendChild(this.container);
  }

  public toggle(value: boolean): void {
    this.container.classList.toggle("open", value);
  }

  public open(item: SidebarItem): void {
    this.setContent(item);
    this.toggle(true);
  }

  public close(): void {
    this.toggle(false);
  }

  public setContent(item: SidebarItem): void {
    this.container.innerHTML = "";
    const innerContainer = document.createElement("div");
    const title = document.createElement("h1");
    const separator = document.createElement("hr");

    title.innerText = item.container.title;
    title.classList.add("drawer-title");

    this.container.appendChild(title);
    this.container.appendChild(separator);
    innerContainer.appendChild(item.drawerContent as HTMLElement);
    this.container.appendChild(innerContainer);
  }
}

class Sidebar {
  public container: HTMLElement;
  public contentContainer: HTMLElement;
  public menu: HTMLElement;
  private drawer: HorizontalDrawer;
  private items: SidebarItem[];
  private mainItem: SidebarItem;

  constructor() {
    this.container = this.createContainer();
    this.contentContainer = this.createContentContainer();
    this.menu = this.createMenu();
    this.drawer = new HorizontalDrawer(this.container);
    this.items = [];
    this.mainItem = new SidebarItem({
      title: "Home",
      icon: Icons.DASHBOARD
    });
    this.addItem(this.mainItem);
    this.mainItem.activate();
  }

  public addItem(item: SidebarItem): void {
    this.items.push(item);
    this.menu.appendChild(item.container);
    item.container.addEventListener("click", () => {
      this.onItemClick(item);
    });
  }

  private createContainer(): HTMLElement {
    const container = document.createElement("div");

    container.classList.add("sidebar-container");
    return container;
  }

  private createContentContainer(): HTMLElement {
    const contentContainer = document.createElement("div");

    contentContainer.id = "sidebar-content-container";
    this.container.appendChild(contentContainer);
    return contentContainer;
  }

  private createMenu(): HTMLElement {
    const menu = document.createElement("ul");

    menu.classList.add("sidebar");
    menu.classList.add("light-green-gradient");
    this.container.appendChild(menu);
    return menu;
  }

  private onItemClick(item: SidebarItem): void {
    if (item.drawerContent === null && item !== this.mainItem) {
      return;
    }
    this.stopAnimatingIfLaggy();

    if (item.active || item === this.mainItem) {
      this.close();
      return;
    }
    this.mainItem.deactivate();

    if (this.drawer.opened) {
      this.swap(item);
    }
    this.open(item);
  }

  private close(): void {
    this.drawer.close();
    this.contentContainer.classList.remove("shifted");
    this.deactivateAllItems();
    this.mainItem.activate();
  }

  private swap(item: SidebarItem): void {
    this.deactivateAllItems();
    item.activate();
    this.drawer.setContent(item);
  }

  private open(item: SidebarItem): void {
    item.activate();
    this.drawer.setContent(item);
    this.drawer.open(item);
    this.contentContainer.classList.add("shifted");
  }

  private deactivateAllItems(): void {
    this.items.forEach(i => i.deactivate());
  }

  private stopAnimatingIfLaggy(): void {
    insertStyleHTML(getItemCount() > 350 ? ":root { --sidebar-drawer-transition: none !important;}" : "", "sidebar-drawer-transition");
  }
}

export function insertMainSidebar(): void {
  insertStyleHTML(SIDEBAR_HTML);
  FAVORITES_SEARCH_GALLERY_CONTAINER.appendChild(MainSidebar.container);
}

export const MainSidebar = new Sidebar();
