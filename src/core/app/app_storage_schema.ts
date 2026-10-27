import { DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT, FAVORITES_WORKSPACE_SNAPSHOT_CODEC } from "@/core/app/favorites/workspace/favorites_workspace";
import { DEFAULT_THEME, THEMES, Theme } from "@/core/ui/theme/theme";
import { GRID_LAYOUTS, GridLayout } from "@/core/ui/post_grid/grid_layout";
import { LIGHTBOX_MODES, LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { TAG_ALIGNMENTS, TagAlignment } from "@/core/app/favorites/lightbox/tag_alignment";
import { TAG_ORGANIZATIONS, TagOrganization } from "@/core/app/favorites/lightbox/tag_organization";
import { TAG_SIZES, TagSize } from "@/core/app/favorites/lightbox/tag_size";
import { hasFields, isInUnitInterval, isNumber, oneOf } from "@/core/utils/guard/guard";
import { Size } from "@/core/utils/geometry/size";
import { StoredTree } from "@/core/utils/stored_value/stored_tree";
import { defineStoredMap } from "@/core/utils/stored_value/stored_map_definition";
import { defineStoredValue } from "@/core/utils/stored_value/stored_value_definition";

const POST_GRID = {
  layout: defineStoredValue<GridLayout>("column", oneOf(GRID_LAYOUTS)),
  columnCount: defineStoredValue(6),
  hdTilesEnabled: defineStoredValue(true)
};

const LIGHTBOX = {
  mode: defineStoredValue<LightboxMode>("full", oneOf(LIGHTBOX_MODES)),
  volume: defineStoredValue(1, isInUnitInterval),
  muted: defineStoredValue(false)
};

const isSize = hasFields<Size>({ width: isNumber, height: isNumber });
const PLACEHOLDER_FAVORITE_SIZES: readonly Size[] = Array.from({ length: 24 }, () => ({ width: 1, height: 1 }));

export const APP_STORAGE_SCHEMA = {
  preferences: {
    shared: {
      postListEnabled: defineStoredValue(false),
      theme: defineStoredValue<Theme>(DEFAULT_THEME, oneOf(THEMES))
    },
    favorites: {
      grid: POST_GRID,
      lightbox: {
        ...LIGHTBOX,
        details: {
          isOpen: defineStoredValue(false),
          organization: defineStoredValue<TagOrganization>("category", oneOf(TAG_ORGANIZATIONS)),
          alignment: defineStoredValue<TagAlignment>("start", oneOf(TAG_ALIGNMENTS)),
          size: defineStoredValue<TagSize>("medium", oneOf(TAG_SIZES))
        }
      },
      pagination: {
        pageSize: defineStoredValue(50, isPageSize),
        infiniteScroll: defineStoredValue(false)
      },
      tabStripVisible: defineStoredValue(true),
      nativeHeaderVisible: defineStoredValue(true),
      activeTool: defineStoredValue<string | null>(null, isToolId)
    },
    postList: {
      grid: POST_GRID,
      lightbox: LIGHTBOX
    }
  },
  state: {
    favorites: defineStoredMap({
      workspace: defineStoredValue(DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT, FAVORITES_WORKSPACE_SNAPSHOT_CODEC),
      sizes: defineStoredValue(PLACEHOLDER_FAVORITE_SIZES, isSizeList)
    })
  }
};

export type AppPreferences = StoredTree<typeof APP_STORAGE_SCHEMA.preferences>;
export type AppState = StoredTree<typeof APP_STORAGE_SCHEMA.state>;

function isToolId(stored: unknown): stored is string | null {
  return stored === null || typeof stored === "string";
}

function isPageSize(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 1;
}

function isSizeList(stored: unknown): stored is readonly Size[] {
  return Array.isArray(stored) && stored.every(isSize);
}
