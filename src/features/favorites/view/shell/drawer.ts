import * as FavoritesChangelog from "@/features/favorites/view/shell/changelog";
import * as FavoritesHelp from "@/features/favorites/view/shell/help";
import * as FavoritesShell from "@/features/favorites/view/shell/shell";
import { FavoritesClass, FavoritesDrawerTabs, FavoritesId } from "@/features/favorites/types/scaffold";
import { FavoritesConfig } from "@/config/favorites_config";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { IconName, icon } from "@/lib/ui/icon";
import { createElement, div } from "@/utils/dom/element_factory";
import { removeDataset, setDataset } from "@/utils/dom/dataset";
import { FavoritesDrawerTab } from "@/types/app";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { queueMacroTask } from "@/lib/async/async";

let activeTab: FavoritesDrawerTab = Preferences.favorites.drawerActiveTab.value;
let renderSettings: (panel: HTMLElement) => void = (): void => undefined;

export function setup(renderSettingsPanel: (panel: HTMLElement) => void): void {
  if (!ON_DESKTOP_DEVICE) {
    return;
  }

  if (!FavoritesConfig.drawerTabLabelsEnabled) {
    setDataset(FavoritesShell.Body, "drawerIconOnly", "");
  }
  renderSettings = renderSettingsPanel;
  FavoritesShell.DrawerTrack.appendChild(createElement(
    "div",
    {
      id: FavoritesId.drawer,
      className: "u-no-select",
      children: [buildTabRail(), buildBody()]
    }
  ));
  selectTab(activeTab);
  setupVersionLabel();

  if (Preferences.favorites.drawerOpen.value) {
    queueMacroTask(openInstantly);
  }
}

export function toggleDrawer(): void {
  const button = document.getElementById(FavoritesId.panelButton);

  if (isOpen()) {
    removeDataset(FavoritesShell.Body, "drawerOpen");
    removeDataset(button, "active");
  } else {
    setDataset(FavoritesShell.Body, "drawerOpen", "");
    setDataset(button, "active", "");
  }
  Preferences.favorites.drawerOpen.set(isOpen());
}

function isOpen(): boolean {
  return FavoritesShell.Body.dataset.drawerOpen !== undefined;
}

function setupVersionLabel(): void {
  const version = document.getElementById(FavoritesId.brandVersion);

  if (version === null) {
    return;
  }
  version.onclick = (): void => {
    if (!isOpen()) {
      toggleDrawer();
    }

    if (activeTab !== "change") {
      selectTab("change");
    }
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
  Preferences.favorites.drawerActiveTab.set(tab);
  updateTitle(tab);

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
  toggleDrawer();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  drawerElement.offsetHeight;
  drawerElement.style.transition = "";
}

function buildBody(): HTMLElement {
  return createElement("div", {
    id: FavoritesId.drawerBody,
    children: [buildTitle(), buildPanels()]
  });
}

function buildTitle(): HTMLElement {
  return createElement("div", { id: FavoritesId.drawerTitle });
}

function updateTitle(tab: FavoritesDrawerTab): void {
  const title = document.getElementById(FavoritesId.drawerTitle);

  if (title === null) {
    return;
  }
  const descriptor = FavoritesDrawerTabs.find(({ tab: candidate }) => candidate === tab);

  title.textContent = descriptor?.title ?? descriptor?.label ?? "";
}

function buildTabRail(): HTMLElement {
  const rail = div(FavoritesId.drawerTabStrip);

  for (const { tab, label, icon: iconName } of FavoritesDrawerTabs) {
    rail.appendChild(buildTab(tab, label, iconName));
  }
  return rail;
}

function buildTab(tab: FavoritesDrawerTab, label: string, iconName: IconName): HTMLElement {
  const button = document.createElement("button");

  button.id = tabId(tab);
  button.className = FavoritesClass.drawerTab;

  button.appendChild(icon(iconName));

  if (FavoritesConfig.drawerTabLabelsEnabled) {
    const labelSpan = document.createElement("span");

    labelSpan.className = FavoritesClass.drawerTabLabel;
    labelSpan.textContent = label;
    button.appendChild(labelSpan);
  } else {
    addTooltip(button, label, "right");
  }
  button.onclick = (): void => {
    selectTab(tab);
  };
  return button;
}

function buildPanels(): HTMLElement {
  const panels = div(FavoritesId.drawerTabPanels);

  for (const { tab } of FavoritesDrawerTabs) {
    const panel = div(panelId(tab));

    panel.className = FavoritesClass.drawerPanel;
    renderPanelContent(tab, panel);
    panels.appendChild(panel);
  }
  return panels;
}

function renderPanelContent(tab: FavoritesDrawerTab, panel: HTMLElement): void {
  switch (tab) {
    case "settings":
      renderSettings(panel);
      break;
    case "change":
      FavoritesChangelog.buildChangelogPanel(panel);
      break;
    case "help":
      FavoritesHelp.buildHelpPanel(panel);
      break;
    default:
      break;
  }
}
