import { ActionBarButton, ActionBarMode } from "@/lib/ui/thumb/action_bar";
import { EnableRule, enableWhen } from "@/lib/ui/settings/enable_rule";
import { Layout, PerformanceProfile } from "@/types/app";
import { SettingsControl, dropdown, multiSegmented, segmented, stepper } from "@/lib/ui/settings/controls";
import { AppContext } from "@/app/context/context";
import { Preferences } from "@/app/context/preferences";
import { ThumbConfig } from "@/config/thumb_config";
import { ToggleSetting } from "@/lib/ui/settings/setting";
import { booleanPreference } from "@/lib/storage/preference";
import { buildToggleRow } from "@/lib/ui/settings/components/toggle";
import { effect } from "@/core/utils/reactive/signal";

type ToggleConfig = Partial<ToggleSetting> & Pick<ToggleSetting, "preference">;

export type PostListSettingsCatalog = Record<string, SettingsControl>;

export function buildPostListSettingsCatalog(context: AppContext): PostListSettingsCatalog {
  const { preferences, environment, features } = context;
  return {
    upscale: toggle({
      id: "post-list-upscale",
      label: "Upscale",
      tooltip: "Upscale thumbnails on search pages",
      enabled: features.has("gallery") && environment.device === "desktop" && preferences.app.performanceProfile.value === "normal",
      preference: preferences.postList.upscaleThumbs
    }),
    infiniteScroll: toggle({
      id: "post-list-inf-scroll",
      label: "Infinite Scroll",
      tooltip: "Use infinite scroll instead of pages",
      preference: preferences.postList.infiniteScroll
    }),
    autoplay: toggle({
      id: "enable-autoplay",
      label: "Autoplay",
      tooltip: "Autoplay in gallery",
      enabled: features.has("gallery"),
      preference: preferences.gallery.autoplayActive
    }),
    tooltip: toggle({
      id: "enable-tooltip",
      label: "Tooltip",
      tooltip: "Show tags when hovering over a thumbnail",
      enabled: features.has("tooltip"),
      preference: preferences.postList.tooltipEnabled
    }),
    galleryMenu: toggle({
      id: "enable-gallery-menu",
      label: "Gallery Menu",
      tooltip: "Show menu in gallery",
      enabled: features.has("gallery"),
      preference: preferences.gallery.menuEnabled
    }),
    favoriteIndicator: toggle({
      id: "favorite-indicator",
      label: "Favorite Indicator",
      tooltip: "Mark thumbs already favorited",
      preference: preferences.postList.favoriteIndicator
    }),
    postActionBar: segmented<ActionBarMode>({
      id: "post-action-bar",
      label: "Actions",
      tooltip: "Show actions thumbnails",
      preference: preferences.postList.postActionBar,
      options: new Map<ActionBarMode, string>([
        ["always", "Always"],
        ["hover", "Hover"],
        ["off", "Off"]
      ])
    }),
    postActionBarButtons: multiSegmented<ActionBarButton>({
      id: "post-action-bar-buttons",
      label: "Action Buttons",
      tooltip: "Choose which actions appear on thumbnails",
      preference: preferences.postList.postActionBarButtons,
      requireSelection: true,
      options: new Map<ActionBarButton, string>([
        [ActionBarButton.Favorite, "Favorite"],
        [ActionBarButton.Download, "Download"],
        [ActionBarButton.Open, "Open"]
      ])
    }),
    postActionBarToggle: toggle({
      id: "post-action-bar-toggle",
      label: "Show Actions",
      tooltip: "Show actions on thumbnails",
      preference: booleanPreference<ActionBarMode>(preferences.postList.postActionBar, "always", "off")
    }),
    layout: dropdown<Layout>({
      id: "layout-select",
      label: "Layout",
      tooltip: "Change layout",
      preference: preferences.postList.layout,
      options: new Map<Layout, string>([
        ["native", "Native"],
        ["column", "Waterfall"],
        ...(environment.device === "mobile" ? [] : [["row", "River"] as [Layout, string]]),
        ["square", "Square"],
        ["grid", "Grid"]
      ])
    }),
    columnCount: stepper({
      id: "column-count",
      label: "Columns",
      tooltip: "Number of columns",
      preference: preferences.postList.columnCount,
      min: ThumbConfig.columnCountBounds.min,
      max: environment.device === "desktop" ? ThumbConfig.columnCountBounds.max.desktop : 10,
      step: 1,
      enabledWhen: whenLayoutIs(preferences, (layout) => layout !== "row" && layout !== "native")
    }),
    rowHeight: stepper({
      id: "row-size",
      label: "Row Height",
      tooltip: "Row height in the river layout",
      preference: preferences.postList.rowHeight,
      min: ThumbConfig.rowHeightBounds.min,
      max: ThumbConfig.rowHeightBounds.max,
      step: 1,
      enabledWhen: whenLayoutIs(preferences, (layout) => layout === "row")
    }),
    performanceProfile: dropdown<PerformanceProfile>({
      id: "performance-profile",
      label: "Performance",
      tooltip: "Choose performance profile",
      preference: preferences.app.performanceProfile,
      enabled: environment.device === "desktop",
      options: new Map<PerformanceProfile, string>([
        ["normal", "Normal"],
        ["low", "Low"],
        ["potato", "Potato"]
      ])
    }),
    mobileGallery: toggle({
      id: "enable-mobile-gallery",
      label: "Gallery",
      enabled: features.has("gallery"),
      preference: preferences.gallery.mobileEnabled
    })
  };
}

function toggle(config: ToggleConfig): SettingsControl {
  return (): HTMLElement => {
    const { preference } = config;
    const row = buildToggleRow(config, { onToggle: () => preference.set(!preference.value), size: "small" });

    effect(() => row.setChecked(preference.value));
    row.setDisabled(config.enabled === false);
    return row.element;
  };
}

function whenLayoutIs(preferences: Preferences, predicate: (layout: Layout) => boolean): EnableRule {
  return enableWhen(preferences.postList.layout, predicate);
}
