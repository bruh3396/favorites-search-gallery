import { CollapseAllButton } from "@/lib/ui/settings/components/collapse_all_button";
import { FavoritesDrawerViewContent } from "@/types/favorite";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { buildCollapsibleSection } from "@/lib/ui/settings/components/section";
import { createElement } from "@/utils/browser/element";
import { doNothing } from "@/utils/pure/function";

const releases = new Map<string, string[]>([
  [
    "v1.23.3",
    [
      "Fixed pressing Enter on an autocomplete suggestion also triggering a search",
      "Fixed pressing Tab selecting the suggestion after the highlighted one",
      "Improved upscaled thumbnail quality"
    ]
  ],
  [
    "v1.23.2",
    ["Fixed Firefox thumb upscaling"]
  ],
  [
    "v1.23.1",
    [
      "Added infinitely nested search support",
      "Added group negation, e.g. -( tag1 ~ tag2 )",
      "Added upscale toggle and removed medium performance profile",
      "Added thumbnail upscaling to mobile",
      "Reduced memory usage",
      "Fixed favorites clipping at bottom on mobile",
      "Fixed default sort by ascending",
      "Added progress bar to loading cached favorites"
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
  const sections = Array.from(releases, ([version, changes], index) => buildCollapsibleSection({
    title: version,
    collapsed: index !== 0,
    children: [bulletList(changes)],
    onToggle: () => collapseAll.refresh()
  }));
  const collapseAll = new CollapseAllButton(sections, doNothing);
  return {
    mount: (panel): void => {
      panel.classList.add(SettingsClass.view);
      panel.append(createElement("div", { className: SettingsClass.body, children: sections }));
    },
    actions: [collapseAll.element]
  };
}

function bulletList(items: string[]): HTMLUListElement {
  return createElement("ul", { children: items.map(item => createElement("li", { textContent: item }))});
}
