import { ALL_RATINGS_MASK, isRatingMask } from "@/core/domain/post/post";
import { GRID_LAYOUTS, GridLayout } from "@/core/ui/post_grid/tiler";
import { Preference, PreferenceStorage, Preferences, createPreferences, definePreference, defineRecordPreference } from "@/core/utils/reactive/preference";
import { SORT_KEYS, SearchSettings } from "@/core/features/favorites/search/inputs";
import { isBoolean, oneOf, sameKindAs } from "@/core/utils/guards/guards";
import { PaginationSettings } from "@/core/features/favorites/search/pagination";

export interface AppPreferenceValues {
  readonly postGridLayout: GridLayout;
  readonly postGridSize: number;
  readonly postGridUpscale: boolean;
  readonly favoritesPagination: PaginationSettings;
  readonly favoritesSearch: SearchSettings;
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
    postGridUpscale: definePreference(false),
    favoritesPagination: defineRecordPreference<PaginationSettings>(
      { size: 50, infiniteScroll: false },
      { size: isPageSize, infiniteScroll: isBoolean }
    ),
    favoritesSearch: defineRecordPreference<SearchSettings>(
      {
        query: "",
        isInverted: false,
        sortKey: "favorited",
        isSortAscending: false,
        allowedRatings: ALL_RATINGS_MASK,
        isBlacklistEnabled: false,
        isShuffled: false,
        shuffleSeed: 0
      },
      {
        query: sameKindAs(""),
        isInverted: isBoolean,
        sortKey: oneOf(SORT_KEYS),
        isSortAscending: isBoolean,
        allowedRatings: isRatingMask,
        isBlacklistEnabled: isBoolean,
        isShuffled: isBoolean,
        shuffleSeed: isSeed
      }
    )
  }, storage);
}

export function pickPostGridPreferences(preferences: AppPreferences): PostGridPreferences {
  return { layout: preferences.postGridLayout, size: preferences.postGridSize, upscale: preferences.postGridUpscale };
}

function isPageSize(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 1;
}

function isSeed(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 0;
}
