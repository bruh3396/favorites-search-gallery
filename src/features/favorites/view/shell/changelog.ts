import { FavoritesDrawerViewContent } from "@/types/favorite";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";
import { toggleDataset } from "@/utils/browser/dataset";

const releases = new Map<string, string[]>([
  [
    "v1.23.1",
    [
      "Added infinitely nested search support",
      "Added group negation, e.g. -( tag1 ~ tag2 )",
      "Reduced memory usage"
    ]
  ],
  [
    "v1.23.0",
    ["Improved search speed"]
  ],
  [
    "v1.22.4",
    ["Fixed searches with multiple wildcards in an or group returning no results"]
  ],
  [
    "v1.22.3",
    [
      "Improved search speed for wildcard and partial tag searches",
      "Fixed lag in the gallery",
      "Fixed link previews showing over the gallery on Firefox",
      "Fixed autoplay menu appearing blacked out on themed backgrounds"
    ]
  ],
  [
    "v1.22.2",
    [
      "Fixed action buttons on mobile",
      "Fixed infinite scroll on search page",
      "Added nested or searches"
    ]
  ],
  [
    "v1.22.1",
    [
      "Added touch and hold to favorite on mobile",
      "Fixed accidentally removing favorites on mobile when exiting gallery"
    ]
  ],
  [
    "v1.22.0",
    [
      "Redesigned favorites ui",
      "Added search page favorite indicator",
      "Added themes",
      "Added download naming",
      "Improved thumb overlay",
      "Improved performance"
    ]
  ]
]);

export function buildDrawerView(): FavoritesDrawerViewContent {
  let panel: HTMLElement | undefined;
  const button = collapseExpandButton(() => panel);
  const syncButton = (): void => {
    if (panel !== undefined) {
      renderCollapseState(button, allSectionsCollapsed(panel));
    }
  };
  return {
    mount: (mountPoint): void => {
      mountPoint.classList.add(SettingsClass.view);
      mountPoint.append(createElement("div", { className: SettingsClass.body, children: Array.from(releases, ([version, changes], index) => section(version, changes, index, syncButton)) }));
      panel = mountPoint;
    },
    actions: [button]
  };
}

function collapseExpandButton(getPanel: () => HTMLElement | undefined): HTMLElement {
  const button = createElement("button", { className: SettingsClass.collapseExpand, children: [icon("collapseAll"), icon("expandAll")] });

  button.type = "button";
  renderCollapseState(button, false);
  button.addEventListener("click", () => {
    const panel = getPanel();

    if (panel === undefined) {
      return;
    }
    toggleAllSections(panel);
    renderCollapseState(button, allSectionsCollapsed(panel));
  });
  return button;
}

function toggleAllSections(panel: HTMLElement): void {
  const isCollapsed = !allSectionsCollapsed(panel);

  for (const element of sections(panel)) {
    toggleDataset(element, "collapsed", isCollapsed);
  }
}

function allSectionsCollapsed(panel: HTMLElement): boolean {
  const all = sections(panel);
  return all.length > 0 && all.every((element) => element.dataset.collapsed !== undefined);
}

function sections(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(`.${SettingsClass.section}`));
}

function renderCollapseState(button: HTMLElement, collapsed: boolean): void {
  toggleDataset(button, "collapsed", collapsed);
  addTooltip(button, `${collapsed ? "Expand" : "Collapse"} all`, "below");
}

function section(version: string, changes: string[], index: number, onToggle: () => void): HTMLElement {
  const isCollapsed = index !== 0;
  const container = createElement("section", { className: SettingsClass.section, dataset: isCollapsed ? { collapsed: "" } : undefined });
  const title = createElement("span", { className: SettingsClass.sectionTitle, textContent: version });
  const header = createElement("button", { className: SettingsClass.sectionHeader, children: [title, icon("chevronDown")] });
  const body = createElement("div", { className: SettingsClass.group, children: [bulletList(changes)] });
  const wrap = createElement("div", { className: SettingsClass.groupWrap, children: [body] });

  header.type = "button";
  header.addEventListener("click", () => {
    toggleDataset(container, "collapsed");
    onToggle();
  });

  container.append(header, wrap);
  return container;
}

function bulletList(items: string[]): HTMLUListElement {
  return createElement("ul", { children: items.map(item => createElement("li", { textContent: item }))});
}
