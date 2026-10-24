import { GRID_LAYOUTS, GridLayout } from "@/core/ui/post_grid/tiler";
import { PreferenceSchema, PreferenceStorage, Preferences, createPreferences, definePreference } from "@/core/utils/reactive/preference";
import { isInUnitInterval, oneOf } from "@/core/utils/guards/guards";

export interface PostGridPreferenceValues {
  readonly layout: GridLayout;
  readonly tilesPerRow: number;
  readonly upscale: boolean;
}

export interface FavoritesPreferenceValues extends PostGridPreferenceValues {
  readonly pageSize: number;
  readonly infiniteScroll: boolean;
  readonly tabStripVisible: boolean;
  readonly enhanceSearchPages: boolean;
  readonly siteHeaderVisible: boolean;
  readonly expandedSettingSections: readonly string[];
  readonly activeTool: string | null;
}

export interface LightboxPreferenceValues {
  readonly volume: number;
  readonly muted: boolean;
  readonly detailsOpen: boolean;
}

export type PostGridPreferences = Preferences<PostGridPreferenceValues>;
export type FavoritesPreferences = Preferences<FavoritesPreferenceValues>;
export type PostListPreferences = PostGridPreferences;
export type LightboxPreferences = Preferences<LightboxPreferenceValues>;

export function createFavoritesPreferences(storage: PreferenceStorage): FavoritesPreferences {
  return createPreferences<FavoritesPreferenceValues>({
    ...definePostGridPreferences(),
    pageSize: definePreference(3, isPageSize),
    infiniteScroll: definePreference(false),
    tabStripVisible: definePreference(true),
    enhanceSearchPages: definePreference(false),
    siteHeaderVisible: definePreference(true),
    expandedSettingSections: definePreference<readonly string[]>(["general", "results"]),
    activeTool: definePreference<string | null>(null, isToolId)
  }, storage);
}

export function createPostListPreferences(storage: PreferenceStorage): PostListPreferences {
  return createPreferences(definePostGridPreferences(), storage);
}

export function createLightboxPreferences(storage: PreferenceStorage): LightboxPreferences {
  return createPreferences<LightboxPreferenceValues>({
    volume: definePreference(1, isInUnitInterval),
    muted: definePreference(false),
    detailsOpen: definePreference(false)
  }, storage);
}

function definePostGridPreferences(): PreferenceSchema<PostGridPreferenceValues> {
  return {
    layout: definePreference<GridLayout>("column", oneOf(GRID_LAYOUTS)),
    tilesPerRow: definePreference(6),
    upscale: definePreference(true)
  };
}

function isToolId(stored: unknown): stored is string | null {
  return stored === null || typeof stored === "string";
}

function isPageSize(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 1;
}
