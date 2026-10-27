import { DEFAULT_THEME, THEMES, Theme } from "@/core/ui/theme/theme";
import { GRID_LAYOUTS, GridLayout } from "@/core/ui/post_grid/grid_layout";
import { LIGHTBOX_MODES, LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { TAG_ALIGNMENTS, TagAlignment } from "@/core/app/favorites/lightbox_details/tag_alignment";
import { TAG_ORGANIZATIONS, TagOrganization } from "@/core/app/favorites/lightbox_details/tag_organization";
import { TAG_SIZES, TagSize } from "@/core/app/favorites/lightbox_details/tag_size";
import { isInUnitInterval, oneOf } from "@/core/utils/guard/guard";
import { PreferenceTree } from "@/core/utils/preference/preference_tree";
import { definePreference } from "@/core/utils/preference/preference_definition";

const POST_GRID = {
  layout: definePreference<GridLayout>("column", oneOf(GRID_LAYOUTS)),
  columnCount: definePreference(6),
  hdTilesEnabled: definePreference(true)
};

const LIGHTBOX = {
  mode: definePreference<LightboxMode>("full", oneOf(LIGHTBOX_MODES)),
  volume: definePreference(1, isInUnitInterval),
  muted: definePreference(false)
};

export const APP_PREFERENCE_SCHEMA = {
  app: {
    postListEnabled: definePreference(false),
    theme: definePreference<Theme>(DEFAULT_THEME, oneOf(THEMES))
  },
  favorites: {
    grid: POST_GRID,
    lightbox: {
      ...LIGHTBOX,
      details: {
        open: definePreference(false),
        organization: definePreference<TagOrganization>("category", oneOf(TAG_ORGANIZATIONS)),
        alignment: definePreference<TagAlignment>("start", oneOf(TAG_ALIGNMENTS)),
        size: definePreference<TagSize>("medium", oneOf(TAG_SIZES))
      }
    },
    pageSize: definePreference(50, isPageSize),
    infiniteScroll: definePreference(false),
    tabStripVisible: definePreference(true),
    nativeHeaderVisible: definePreference(true),
    activeTool: definePreference<string | null>(null, isToolId)
  },
  postList: {
    grid: POST_GRID,
    lightbox: LIGHTBOX,
    infiniteScroll: definePreference(false),
    favoriteIndicator: definePreference(false)
  }
};

export type AppPreferences = PreferenceTree<typeof APP_PREFERENCE_SCHEMA>;

function isToolId(stored: unknown): stored is string | null {
  return stored === null || typeof stored === "string";
}

function isPageSize(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 1;
}
