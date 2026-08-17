import { removeDataset, setDataset } from "@/utils/dom/dataset";
import { Preferences } from "@/app/context/preferences";
import { Settings } from "@/features/post_list_navigator/control/settings";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SettingsControl } from "@/lib/ui/settings/controls";
import { createElement } from "@/utils/dom/element_factory";
import { icon } from "@/lib/ui/icon";

interface SettingsSection {
  title: string;
  controls: SettingsControl[];
}

const sections: SettingsSection[] = [
  {
    title: "Favorites Search Gallery",
    controls: [
      Settings.upscale,
      Settings.infiniteScroll,
      Settings.autoplay,
      Settings.tooltip,
      Settings.galleryMenu,
      Settings.favoriteIndicator,
      Settings.postActionBar,
      Settings.postActionBarStatic,
      Settings.layout,
      Settings.columnCount,
      Settings.rowHeight,
      Settings.favoriteIndicatorStyle,
      Settings.galleryFavoriteStyle,
      Settings.performanceProfile
    ]
  }
];

export function build(panel: HTMLElement): void {
  panel.classList.add(SettingsClass.view);

  for (const section of sections) {
    panel.appendChild(buildSection(section));
  }
}

function buildSection(settingsSection: SettingsSection): HTMLElement {
  const isCollapsed = Preferences.postList.settingsCollapsed.value;
  const section = createElement("section", { className: SettingsClass.section, dataset: isCollapsed ? { collapsed: "" } : undefined });
  const title = createElement("span", { className: SettingsClass.sectionTitle, textContent: settingsSection.title });
  const header = createElement("button", { className: SettingsClass.sectionHeader, children: [title, icon("chevronDown")] });

  header.type = "button";
  const body = createElement("div", { className: SettingsClass.group, children: settingsSection.controls.map((control) => control()) });
  const wrap = createElement("div", { className: SettingsClass.groupWrap, children: [body] });

  header.addEventListener("click", () => {
    toggleSection(section);
  });

  section.append(header, wrap);
  return section;
}

function toggleSection(element: HTMLElement): void {
  const isCollapsed = element.dataset.collapsed === undefined;

  if (isCollapsed) {
    setDataset(element, "collapsed");
  } else {
    removeDataset(element, "collapsed");
  }
  Preferences.postList.settingsCollapsed.set(isCollapsed);
}
