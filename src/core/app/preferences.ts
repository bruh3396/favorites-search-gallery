import { GRID_LAYOUTS, GridLayout } from "@/core/ui/post_grid/tiler";
import { Preference, PreferenceStorage, Preferences, createPreferences, definePreference, defineRecordPreference } from "@/core/utils/reactive/preference";
import { isBoolean, isInUnitInterval, oneOf } from "@/core/utils/guards/guards";
import { PaginationSettings } from "@/core/features/favorites/search/pagination";

export interface AppPreferenceValues {
  readonly postGridLayout: GridLayout;
  readonly postGridSize: number;
  readonly postGridUpscale: boolean;
  readonly favoritesPagination: PaginationSettings;
  readonly lightboxVolume: number;
  readonly lightboxMuted: boolean;
}

export type AppPreferences = Preferences<AppPreferenceValues>;

export interface PostGridPreferences {
  readonly layout: Preference<GridLayout>;
  readonly size: Preference<number>;
  readonly upscale: Preference<boolean>;
}

export function createAppPreferences(storage: PreferenceStorage): AppPreferences {
  return createPreferences<AppPreferenceValues>({
    postGridLayout: definePreference<GridLayout>("column", oneOf(GRID_LAYOUTS)),
    postGridSize: definePreference(6),
    postGridUpscale: definePreference(true),
    favoritesPagination: defineRecordPreference<PaginationSettings>(
      { size: 50, infiniteScroll: false },
      { size: isPageSize, infiniteScroll: isBoolean }
    ),
    lightboxVolume: definePreference(1, isInUnitInterval),
    lightboxMuted: definePreference(false)
  }, storage);
}

export function pickPostGridPreferences(preferences: AppPreferences): PostGridPreferences {
  return { layout: preferences.postGridLayout, size: preferences.postGridSize, upscale: preferences.postGridUpscale };
}

function isPageSize(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 1;
}
