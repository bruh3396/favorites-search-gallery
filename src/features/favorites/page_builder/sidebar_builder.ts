import * as Icons from "../../../assets/icons";
import {HELP_HTML, SETTINGS_HTML} from "../../../assets/html";
import {SidebarItem, SidebarItemOptions} from "./sidebar_item";
import {Events} from "../../../lib/functional/events";
import {MainSidebar} from "./sidebar";
import {tryResetting} from "../../../lib/reset/reset";

function addSidebarItem(options: SidebarItemOptions): void {
  MainSidebar.addItem(new SidebarItem(options));
}

export function buildFavoritesSidebar(): void {
  addSidebarItem({
    title: "Search",
    icon: Icons.SEARCH,
    onclick: (event) => {
      Events.favorites.searchButtonClicked.emit(event);
    }
  });
  addSidebarItem({
    title: "Shuffle",
    icon: Icons.SHUFFLE,
    onclick: (event) => {
      Events.favorites.shuffleButtonClicked.emit(event);
    }
  });
  addSidebarItem({
    title: "Settings",
    icon: Icons.SETTINGS,
    drawerHTML: SETTINGS_HTML
  });
  addSidebarItem({
    title: "Help",
    icon: Icons.HELP,
    drawerHTML: HELP_HTML
  });
  addSidebarItem({
    title: "Reset",
    icon: Icons.POWER,
    onclick: () => {
      tryResetting();
    }
  });
}
