import { removeDataset, setDataset } from "@/utils/browser/dataset";
import { AppContext } from "@/app/context/context";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SettingsControl } from "@/lib/ui/settings/controls";
import { buildPostListSettingsCatalog } from "@/features/post_list_navigator/control/catalog";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";

interface SettingsSection {
  title: string;
  controls: SettingsControl[];
}

function buildSections(context: AppContext): SettingsSection[] {
  const catalog = buildPostListSettingsCatalog(context);

  if (context.environment.onDesktopDevice) {
    return [
      {
        title: "Favorites Search Gallery",
        controls: [
          catalog.upscale,
          catalog.infiniteScroll,
          catalog.autoplay,
          catalog.tooltip,
          catalog.galleryMenu,
          catalog.favoriteIndicator,
          catalog.postActionBar,
          catalog.postActionBarButtons,
          catalog.layout,
          catalog.columnCount,
          catalog.rowHeight,
          catalog.performanceProfile
        ]
      }
    ];
  }
  return [
    {
      title: "Favorites Search Gallery",
      controls: [
        catalog.favoriteIndicator,
        catalog.mobileGallery,
        catalog.infiniteScroll,
        catalog.layout,
        catalog.columnCount,
        catalog.postActionBarToggle,
        catalog.postActionBarButtons,
        catalog.autoplay
      ]
    }
  ];
}

export function build(context: AppContext, panel: HTMLElement): void {
  panel.classList.add(SettingsClass.view);

  for (const section of buildSections(context)) {
    panel.appendChild(buildSection(context, section));
  }
}

function buildSection(context: AppContext, settingsSection: SettingsSection): HTMLElement {
  const isCollapsed = context.preferences.postList.settingsCollapsed.value;
  const section = createElement("section", { className: SettingsClass.section, dataset: isCollapsed ? { collapsed: "" } : undefined });
  const title = createElement("span", { className: SettingsClass.sectionTitle, textContent: settingsSection.title });
  const header = createElement("button", { className: SettingsClass.sectionHeader, children: [title, icon("chevronDown")] });
  const body = createElement("div", { className: SettingsClass.group, children: settingsSection.controls.map((control) => control()) });
  const wrap = createElement("div", { className: SettingsClass.groupWrap, children: [body] });

  header.type = "button";

  header.addEventListener("click", () => {
    toggleSection(context, section);
  });

  section.append(header, wrap);
  return section;
}

function toggleSection(context: AppContext, element: HTMLElement): void {
  const isCollapsed = element.dataset.collapsed === undefined;

  if (isCollapsed) {
    setDataset(element, "collapsed");
  } else {
    removeDataset(element, "collapsed");
  }
  context.preferences.postList.settingsCollapsed.set(isCollapsed);
}
