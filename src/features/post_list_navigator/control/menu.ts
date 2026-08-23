import { removeDataset, setDataset } from "@/utils/browser/dataset";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { PostListSettingsCatalog } from "@/features/post_list_navigator/control/catalog";
import { Preferences } from "@/app/context/preferences";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SettingsControl } from "@/lib/ui/settings/controls";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";

interface SettingsSection {
  title: string;
  controls: SettingsControl[];
}

const DesktopSettingsSections: SettingsSection[] = [
  {
    title: "Favorites Search Gallery",
    controls: [
      PostListSettingsCatalog.upscale,
      PostListSettingsCatalog.infiniteScroll,
      PostListSettingsCatalog.autoplay,
      PostListSettingsCatalog.tooltip,
      PostListSettingsCatalog.galleryMenu,
      PostListSettingsCatalog.favoriteIndicator,
      PostListSettingsCatalog.postActionBar,
      PostListSettingsCatalog.postActionBarButtons,
      PostListSettingsCatalog.layout,
      PostListSettingsCatalog.columnCount,
      PostListSettingsCatalog.rowHeight,
      PostListSettingsCatalog.performanceProfile
    ]
  }
];
const MobileSettingsSections: SettingsSection[] = [
  {
    title: "Favorites Search Gallery",
    controls: [
      PostListSettingsCatalog.favoriteIndicator,
      PostListSettingsCatalog.mobileGallery,
      PostListSettingsCatalog.infiniteScroll,
      PostListSettingsCatalog.layout,
      PostListSettingsCatalog.columnCount,
      PostListSettingsCatalog.postActionBarToggle,
      PostListSettingsCatalog.postActionBarButtons,
      PostListSettingsCatalog.autoplay
    ]
  }
];
const sections: SettingsSection[] = ON_DESKTOP_DEVICE ? DesktopSettingsSections : MobileSettingsSections;

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
  const body = createElement("div", { className: SettingsClass.group, children: settingsSection.controls.map((control) => control()) });
  const wrap = createElement("div", { className: SettingsClass.groupWrap, children: [body] });

  header.type = "button";

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
