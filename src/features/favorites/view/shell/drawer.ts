import * as FavoritesChangelogPanel from "@/features/favorites/view/shell/changelog";
import * as FavoritesHelpPanel from "@/features/favorites/view/shell/help";
import * as FavoritesSettingsPanel from "@/features/favorites/view/shell/settings";
import { Body, DrawerTrack } from "@/features/favorites/view/shell/shell";
import { FavoritesClass, FavoritesDrawerTabs, FavoritesId } from "@/features/favorites/types/scaffold";
import { IconName, icon } from "@/lib/ui/icon";
import { removeDataset, setDataset } from "@/utils/dom/attribute";
import { FavoritesDrawerTab } from "@/types/ui";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { yieldControl } from "@/lib/async/timing";

let activeTab: FavoritesDrawerTab = Preferences.favoritesDrawerActiveTab.value;

export async function setup(): Promise<void> {
  if (!ON_DESKTOP_DEVICE) {
    return;
  }
  const drawer = document.createElement("div");

  drawer.id = FavoritesId.drawer;
  drawer.appendChild(buildTabRail());
  drawer.appendChild(buildPanels());
  DrawerTrack.appendChild(drawer);
  FavoritesSettingsPanel.wireSettingsPanel();
  selectTab(activeTab);
  wireVersionLabel();

  if (Preferences.favoritesDrawerOpen.value) {
    await yieldControl();
    openInstantly();
  }
}

export function toggle(): void {
  const open = Body.dataset.drawerOpen === undefined;
  const button = document.getElementById(FavoritesId.panelButton);

  if (open) {
    setDataset(Body, "drawerOpen", "");
    setDataset(button, "active", "");
  } else {
    removeDataset(Body, "drawerOpen");
    removeDataset(button, "active");
  }
  Preferences.favoritesDrawerOpen.set(open);
}

function toggleTo(tab: FavoritesDrawerTab): void {
  const open = Body.dataset.drawerOpen !== undefined;

  if (open && activeTab === tab) {
    toggle();
    return;
  }
  selectTab(tab);

  if (!open) {
    toggle();
  }
}

function wireVersionLabel(): void {
  const version = document.getElementById(FavoritesId.brandVersion);

  if (version === null) {
    return;
  }
  version.onclick = (): void => {
    toggleTo("change");
  };
}

function tabId(tab: FavoritesDrawerTab): string {
  return `${FavoritesClass.drawerTab}-${tab}`;
}

function panelId(tab: FavoritesDrawerTab): string {
  return `${FavoritesClass.drawerPanel}-${tab}`;
}

function selectTab(tab: FavoritesDrawerTab): void {
  activeTab = tab;
  Preferences.favoritesDrawerActiveTab.set(tab);

  for (const { tab: candidate } of FavoritesDrawerTabs) {
    const isActive = candidate === tab;

    const tabElement = document.getElementById(tabId(candidate));
    const panelElement = document.getElementById(panelId(candidate));

    if (isActive) {
      setDataset(tabElement, "selected", "");
      removeDataset(panelElement, "hidden");
    } else {
      removeDataset(tabElement, "selected");
      setDataset(panelElement, "hidden", "");
    }
  }
}

function openInstantly(): void {
  const drawerElement = document.getElementById(FavoritesId.drawer);

  if (drawerElement === null) {
    return;
  }
  drawerElement.style.transition = "none";
  toggle();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  drawerElement.offsetHeight;
  drawerElement.style.transition = "";
}

function buildTabRail(): HTMLElement {
  const rail = document.createElement("div");

  rail.id = FavoritesId.drawerTabStrip;

  for (const { tab, label, icon: iconName } of FavoritesDrawerTabs) {
    rail.appendChild(buildTab(tab, label, iconName));
  }
  return rail;
}

function buildTab(tab: FavoritesDrawerTab, label: string, iconName: IconName): HTMLElement {
  const button = document.createElement("button");

  button.id = tabId(tab);
  button.className = FavoritesClass.drawerTab;

  const labelSpan = document.createElement("span");

  labelSpan.className = FavoritesClass.drawerTabLabel;
  labelSpan.textContent = label;

  button.appendChild(icon(iconName));
  button.appendChild(labelSpan);
  button.onclick = (): void => {
    selectTab(tab);
  };
  return button;
}

function buildPanels(): HTMLElement {
  const panels = document.createElement("div");

  panels.id = FavoritesId.drawerTabPanels;

  for (const { tab } of FavoritesDrawerTabs) {
    const panel = document.createElement("div");

    panel.id = panelId(tab);
    panel.className = FavoritesClass.drawerPanel;
    renderPanelContent(tab, panel);
    panels.appendChild(panel);
  }
  return panels;
}

function renderPanelContent(tab: FavoritesDrawerTab, panel: HTMLElement): void {
  switch (tab) {
    case "settings":
      FavoritesSettingsPanel.buildSettingsPanel(panel);
      break;
    case "change":
      FavoritesChangelogPanel.buildChangelogPanel(panel);
      break;
    case "help":
      FavoritesHelpPanel.buildHelpPanel(panel);
      break;
    default:
      break;
  }
}
