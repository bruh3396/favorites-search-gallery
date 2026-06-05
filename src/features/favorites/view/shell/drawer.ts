import { Body, DrawerTrack } from "@/app/layout/shell";
import { FavoritesDrawerTab, FavoritesMenuId, favoritesDrawerTabs } from "@/features/favorites/types/menu_ids";
import { removeDataset, setDataset } from "@/utils/dom/attribute";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { yieldControl } from "@/lib/async/timing";

const PANEL_PREFIX = "favorites-menu-drawer-panel-";
const TAB_PREFIX = "favorites-menu-drawer-tab-";

let activeTab: FavoritesDrawerTab = "settings";

export async function setup(): Promise<void> {
  if (!ON_DESKTOP_DEVICE) {
    return;
  }
  const drawer = document.createElement("div");

  drawer.id = FavoritesMenuId.drawer;
  drawer.appendChild(buildTabStrip());
  drawer.appendChild(buildPanels());
  DrawerTrack.appendChild(drawer);
  selectTab(activeTab);
  anchorBelowBar();

  if (Preferences.drawerOpen.value) {
    await yieldControl();
    openInstant();
  }
}

export function toggle(): void {
  const open = Body.dataset.drawerOpen === undefined;
  const button = document.getElementById(FavoritesMenuId.panelButton);

  if (open) {
    setDataset(Body, "drawerOpen", "");
    setDataset(button, "active", "");
  } else {
    removeDataset(Body, "drawerOpen");
    removeDataset(button, "active");
  }
  Preferences.drawerOpen.set(open);
}

export function selectTab(tab: FavoritesDrawerTab): void {
  activeTab = tab;

  for (const { tab: candidate } of favoritesDrawerTabs) {
    const isActive = candidate === tab;

    const tabElement = document.getElementById(TAB_PREFIX + candidate);
    const panelElement = document.getElementById(PANEL_PREFIX + candidate);

    if (isActive) {
      setDataset(tabElement, "selected", "");
      removeDataset(panelElement, "hidden");
    } else {
      removeDataset(tabElement, "selected");
      setDataset(panelElement, "hidden", "");
    }
  }
}

function openInstant(): void {
  const drawerElement = document.getElementById(FavoritesMenuId.drawer);

  if (drawerElement === null) {
    return;
  }
  drawerElement.style.transition = "none";
  toggle();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  drawerElement.offsetHeight;
  drawerElement.style.transition = "";
}

function anchorBelowBar(): void {
  const menu = document.getElementById(FavoritesMenuId.menu);

  if (menu !== null) {
    Body.style.setProperty("--favorites-bar-height", `${menu.offsetHeight}px`);
  }
}

function buildTabStrip(): HTMLElement {
  const tabStrip = document.createElement("div");

  tabStrip.id = FavoritesMenuId.drawerTabStrip;

  for (const { tab, label } of favoritesDrawerTabs) {
    tabStrip.appendChild(buildTab(tab, label));
  }
  return tabStrip;
}

function buildTab(tab: FavoritesDrawerTab, label: string): HTMLElement {
  const button = document.createElement("button");

  button.id = TAB_PREFIX + tab;
  button.className = "favorites-menu-drawer-tab";
  button.textContent = label;
  button.onclick = (): void => {
    selectTab(tab);
  };
  return button;
}

function buildPanels(): HTMLElement {
  const panels = document.createElement("div");

  panels.id = FavoritesMenuId.drawerTabPanels;

  for (const { tab } of favoritesDrawerTabs) {
    const panel = document.createElement("div");

    panel.id = PANEL_PREFIX + tab;
    panel.className = "favorites-menu-drawer-panel";
    panels.appendChild(panel);
  }
  return panels;
}
