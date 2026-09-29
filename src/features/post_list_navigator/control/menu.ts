import * as PostListNavigatorCatalog from "@/features/post_list_navigator/control/catalog";
import { AppContext } from "@/app/context/context";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SettingsControl } from "@/lib/ui/settings/controls";
import { buildCollapsibleSection } from "@/lib/ui/settings/components/section";

interface SettingsSection {
  title: string;
  controls: SettingsControl[];
}

export function mount(context: AppContext, container: HTMLElement): void {
  container.classList.add(SettingsClass.view);

  for (const section of buildSections(context)) {
    container.appendChild(buildSection(context, section));
  }
}

function buildSections(context: AppContext): SettingsSection[] {
  const catalog = PostListNavigatorCatalog.buildPostListSettingsCatalog(context);

  if (context.environment.device === "desktop") {
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

function buildSection(context: AppContext, section: SettingsSection): HTMLElement {
  const { settingsCollapsed } = context.preferences.postList;
  return buildCollapsibleSection({
    title: section.title,
    collapsed: settingsCollapsed.value,
    children: section.controls.map((control) => control()),
    onToggle: settingsCollapsed.set
  });
}
