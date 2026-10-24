import { FavoritesPreferences } from "@/core/app/preferences";
import { SettingDescriptor } from "@/core/ui/settings/descriptor";
import { SettingsLayout } from "@/core/ui/settings/screen";

export const FAVORITES_SETTINGS_LAYOUT: SettingsLayout = [
  { id: "general", title: "General", settings: ["enhanceSearchPages"] },
  { id: "appearance", title: "Appearance", settings: ["siteHeaderVisible"] },
  { id: "results", title: "Results", settings: ["pageSize", "infiniteScroll"] }
];

export function createFavoritesSettings(preferences: FavoritesPreferences): SettingDescriptor[] {
  return [
    {
      id: "enhanceSearchPages", kind: "switch", label: "Enhance search pages", keywords: ["post list", "search"],
      preference: preferences.enhanceSearchPages
    },
    { id: "siteHeaderVisible", kind: "switch", label: "Site header", keywords: ["header", "navigation"], preference: preferences.siteHeaderVisible },
    {
      id: "pageSize", kind: "number", label: "Results per page", keywords: ["pagination", "count"],
      preference: preferences.pageSize, min: 1, max: 5_000, step: 25,
      disabled: preferences.infiniteScroll
    },
    { id: "infiniteScroll", kind: "switch", label: "Infinite scroll", keywords: ["pagination", "scroll"], preference: preferences.infiniteScroll }
  ];
}
