import { DEFAULT_THEME, THEMES, Theme } from "@/core/ui/theme/theme";
import { GRID_LAYOUTS, GridLayout } from "@/core/ui/post_grid/grid_layout";
import { LIGHTBOX_MODES, LightboxMode } from "@/core/features/lightbox/mode";
import { Preference } from "@/core/utils/preference/preference";
import { PreferenceSetSchema, PreferenceSet, createPreferenceSet } from "@/core/utils/preference/preference_set";
import { PreferenceStorage } from "@/core/utils/preference/preference_storage";
import { StoredPreference } from "@/core/utils/preference/stored_preference";
import { definePreference } from "@/core/utils/preference/preference_definition";
import { TAG_ALIGNMENTS, TAG_ORGANIZATIONS, TAG_SIZES, TagAlignment, TagOrganization, TagSize } from "@/core/app/favorites/lightbox_details/view_options";
import { isInUnitInterval, oneOf } from "@/core/utils/guard/guard";
import { ColorScheme } from "@/core/boundary/environment";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";

export interface AppPreferenceValues {
  readonly postListEnabled: boolean;
  readonly theme: Theme;
}

export interface PostGridPreferenceValues {
  readonly layout: GridLayout;
  readonly columnCount: number;
  readonly hdTilesEnabled: boolean;
}

export interface FavoritesPreferenceValues extends PostGridPreferenceValues {
  readonly pageSize: number;
  readonly infiniteScroll: boolean;
  readonly tabStripVisible: boolean;
  readonly nativeHeaderVisible: boolean;
  readonly activeTool: string | null;
}

export interface LightboxPreferenceValues {
  readonly mode: LightboxMode;
  readonly volume: number;
  readonly muted: boolean;
  readonly detailsOpen: boolean;
  readonly detailsOrganization: TagOrganization;
  readonly detailsAlignment: TagAlignment;
  readonly detailsSize: TagSize;
}

export type AppPreferences = PreferenceSet<AppPreferenceValues>;
export type PostGridPreferences =PreferenceSet<PostGridPreferenceValues>;
export type FavoritesPreferences = PreferenceSet<FavoritesPreferenceValues>;
export type PostListPreferences = PostGridPreferences;
export type LightboxPreferences = PreferenceSet<LightboxPreferenceValues>;

export function createAppPreferences(storage: PreferenceStorage): AppPreferences {
  return createPreferenceSet<AppPreferenceValues>({
    postListEnabled: definePreference(false),
    theme: definePreference<Theme>(DEFAULT_THEME, oneOf(THEMES))
  }, storage);
}

export function createFavoritesPreferences(storage: PreferenceStorage): FavoritesPreferences {
  return createPreferenceSet<FavoritesPreferenceValues>({
    ...createPostGridPreferences(),
    pageSize: definePreference(50, isPageSize),
    infiniteScroll: definePreference(false),
    tabStripVisible: definePreference(true),
    nativeHeaderVisible: definePreference(true),
    activeTool: definePreference<string | null>(null, isToolId)
  }, storage);
}

export function createPostListPreferences(storage: PreferenceStorage): PostListPreferences {
  return createPreferenceSet(createPostGridPreferences(), storage);
}

export function createLightboxPreferences(storage: PreferenceStorage): LightboxPreferences {
  return createPreferenceSet<LightboxPreferenceValues>({
    mode: definePreference<LightboxMode>("full", oneOf(LIGHTBOX_MODES)),
    volume: definePreference(1, isInUnitInterval),
    muted: definePreference(false),
    detailsOpen: definePreference(false),
    detailsOrganization: definePreference<TagOrganization>("category", oneOf(TAG_ORGANIZATIONS)),
    detailsAlignment: definePreference<TagAlignment>("start", oneOf(TAG_ALIGNMENTS)),
    detailsSize: definePreference<TagSize>("medium", oneOf(TAG_SIZES))
  }, storage);
}

export function createColorSchemePreference(colorScheme: ColorScheme, hostPage: HostPage): Preference<ColorScheme> {
  return new StoredPreference({ key: "colorScheme", defaultValue: colorScheme }, {
    storage: { get: () => colorScheme, set: (_key, value) => hostPage.setColorScheme(value as ColorScheme) }
  });
}

function createPostGridPreferences(): PreferenceSetSchema<PostGridPreferenceValues> {
  return {
    layout: definePreference<GridLayout>("column", oneOf(GRID_LAYOUTS)),
    columnCount: definePreference(6),
    hdTilesEnabled: definePreference(true)
  };
}

function isToolId(stored: unknown): stored is string | null {
  return stored === null || typeof stored === "string";
}

function isPageSize(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 1;
}
