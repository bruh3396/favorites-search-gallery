import { FavoritesDrawerViewContent } from "@/types/favorite";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";
import { toggleDataset } from "@/utils/browser/dataset";

const releases = new Map<string, string[]>([
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
  return { mount: buildChangelogPanel };
}

function buildChangelogPanel(panel: HTMLElement): void {
  panel.classList.add(SettingsClass.view);
  panel.append(createElement("div", { className: SettingsClass.body, children: Array.from(releases, section) }));
}

function section([version, changes]: [string, string[]], index: number): HTMLElement {
  const isCollapsed = index !== 0;
  const container = createElement("section", { className: SettingsClass.section, dataset: isCollapsed ? { collapsed: "" } : undefined });
  const title = createElement("span", { className: SettingsClass.sectionTitle, textContent: version });
  const header = createElement("button", { className: SettingsClass.sectionHeader, children: [title, icon("chevronDown")] });
  const body = createElement("div", { className: SettingsClass.group, children: [bulletList(changes)] });
  const wrap = createElement("div", { className: SettingsClass.groupWrap, children: [body] });

  header.type = "button";
  header.addEventListener("click", () => {
    toggleDataset(container, "collapsed");
  });

  container.append(header, wrap);
  return container;
}

function bulletList(items: string[]): HTMLUListElement {
  return createElement("ul", { children: items.map(item => createElement("li", { textContent: item }))});
}
