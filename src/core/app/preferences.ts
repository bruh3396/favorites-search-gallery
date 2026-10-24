import { GRID_LAYOUTS, GridLayout } from "@/core/ui/post_grid/tiler";
import { LIGHTBOX_MODES, LightboxMode } from "@/core/features/lightbox/mode";
import { Preference, PreferenceSchema, PreferenceStorage, Preferences, StoredPreference, createPreferences, definePreference } from "@/core/utils/reactive/preference";
import { isInUnitInterval, oneOf } from "@/core/utils/guards/guards";
import { ColorScheme } from "@/core/boundary/environment";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";

export interface AppPreferenceValues {
  readonly postListEnabled: boolean;
}

export interface PostGridPreferenceValues {
  readonly layout: GridLayout;
  readonly tilesPerRow: number;
  readonly fullImagesEnabled: boolean;
}

export interface FavoritesPreferenceValues extends PostGridPreferenceValues {
  readonly pageSize: number;
  readonly infiniteScroll: boolean;
  readonly tabStripVisible: boolean;
  readonly nativeHeaderVisible: boolean;
  readonly expandedSettingSections: readonly string[];
  readonly activeTool: string | null;
}

export interface LightboxPreferenceValues {
  readonly mode: LightboxMode;
  readonly volume: number;
  readonly muted: boolean;
  readonly detailsOpen: boolean;
}

export type AppPreferences = Preferences<AppPreferenceValues>;
export type PostGridPreferences =Preferences<PostGridPreferenceValues>;
export type FavoritesPreferences = Preferences<FavoritesPreferenceValues>;
export type PostListPreferences = PostGridPreferences;
export type LightboxPreferences = Preferences<LightboxPreferenceValues>;

export function createAppPreferences(storage: PreferenceStorage): AppPreferences {
  return createPreferences<AppPreferenceValues>({
    postListEnabled: definePreference(false)
  }, storage);
}

export function createFavoritesPreferences(storage: PreferenceStorage): FavoritesPreferences {
  return createPreferences<FavoritesPreferenceValues>({
    ...createPostGridPreferences(),
    pageSize: definePreference(50, isPageSize),
    infiniteScroll: definePreference(false),
    tabStripVisible: definePreference(true),
    nativeHeaderVisible: definePreference(true),
    expandedSettingSections: definePreference<readonly string[]>(["general"]),
    activeTool: definePreference<string | null>(null, isToolId)
  }, storage);
}

export function createPostListPreferences(storage: PreferenceStorage): PostListPreferences {
  return createPreferences(createPostGridPreferences(), storage);
}

export function createLightboxPreferences(storage: PreferenceStorage): LightboxPreferences {
  return createPreferences<LightboxPreferenceValues>({
    mode: definePreference<LightboxMode>("full", oneOf(LIGHTBOX_MODES)),
    volume: definePreference(1, isInUnitInterval),
    muted: definePreference(false),
    detailsOpen: definePreference(false)
  }, storage);
}

export function createColorSchemePreference(colorScheme: ColorScheme, hostPage: HostPage): Preference<ColorScheme> {
  return new StoredPreference({ key: "colorScheme", defaultValue: colorScheme }, {
    storage: { get: () => colorScheme, set: (_key, value) => hostPage.setColorScheme(value as ColorScheme) }
  });
}

function createPostGridPreferences(): PreferenceSchema<PostGridPreferenceValues> {
  return {
    layout: definePreference<GridLayout>("column", oneOf(GRID_LAYOUTS)),
    tilesPerRow: definePreference(6),
    fullImagesEnabled: definePreference(true)
  };
}

function isToolId(stored: unknown): stored is string | null {
  return stored === null || typeof stored === "string";
}

function isPageSize(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 1;
}
