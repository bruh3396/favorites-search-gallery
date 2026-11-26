import { FavoritesSettingRange } from "@/core/app/favorites/settings/favorites_setting_range";

export const FAVORITES_SETTING_RANGES = {
  columnCount: { min: 1, max: 16, step: 1 },
  pageSize: { min: 1, max: 5_000, step: 25 }
} as const satisfies Record<string, FavoritesSettingRange>;
