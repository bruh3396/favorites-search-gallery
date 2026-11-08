import { DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT, FAVORITES_WORKSPACE_SNAPSHOT_CODEC } from "@/core/app/favorites/workspace/favorites_workspace";
import { DEFAULT_THEME, THEMES, Theme } from "@/core/ui/theme/theme";
import { GRID_LAYOUTS, GridLayout } from "@/core/ui/post_grid/layout/grid_layout";
import { KeyBindings, isKeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { LIGHTBOX_MODES, LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { TAG_ALIGNMENTS, TagAlignment } from "@/core/app/favorites/lightbox/tag_alignment";
import { TAG_ORGANIZATIONS, TagOrganization } from "@/core/app/favorites/lightbox/tag_organization";
import { TAG_SIZES, TagSize } from "@/core/app/favorites/lightbox/tag_size";
import { createFieldsGuard, createListGuard, createOneOfGuard } from "@/core/utils/guard/guard";
import { isInUnitInterval, isNumber, isString } from "@/core/utils/guard/unknown_utilities";
import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { Size } from "@/core/utils/geometry/size";
import { StoredMapDefinition } from "@/core/utils/storage/stored_map_definition";
import { createStoredValueDefinition } from "@/core/utils/storage/stored_value_definition";

const POST_GRID = {
  layout: createStoredValueDefinition<GridLayout>("column", createOneOfGuard(GRID_LAYOUTS)),
  columnCount: createStoredValueDefinition(6),
  hdTilesEnabled: createStoredValueDefinition(true)
};

const LIGHTBOX = {
  mode: createStoredValueDefinition<LightboxMode>("full", createOneOfGuard(LIGHTBOX_MODES)),
  volume: createStoredValueDefinition(1, isInUnitInterval),
  muted: createStoredValueDefinition(false),
  keyBindings: createStoredValueDefinition<KeyBindings<LightboxCommand>>({}, isKeyBindings)
};

const isSizeList = createListGuard(createFieldsGuard<Size>({ width: isNumber, height: isNumber }));
const NO_QUERIES: readonly string[] = [];
const PLACEHOLDER_FAVORITE_SIZES: readonly Size[] = Array.from({ length: 24 }, () => ({ width: 1, height: 1 }));

export const APP_STORAGE_SCHEMA = {
  preferences: {
    shared: {
      postListEnabled: createStoredValueDefinition(false),
      theme: createStoredValueDefinition<Theme>(DEFAULT_THEME, createOneOfGuard(THEMES))
    },
    favorites: {
      grid: POST_GRID,
      lightbox: {
        ...LIGHTBOX,
        details: {
          isOpen: createStoredValueDefinition(false),
          organization: createStoredValueDefinition<TagOrganization>("category", createOneOfGuard(TAG_ORGANIZATIONS)),
          alignment: createStoredValueDefinition<TagAlignment>("start", createOneOfGuard(TAG_ALIGNMENTS)),
          size: createStoredValueDefinition<TagSize>("medium", createOneOfGuard(TAG_SIZES))
        }
      },
      pagination: {
        pageSize: createStoredValueDefinition(50, isPageSize),
        infiniteScroll: createStoredValueDefinition(false)
      },
      nativeHeaderVisible: createStoredValueDefinition(true),
      keyBindings: createStoredValueDefinition<KeyBindings<FavoritesCommand>>({}, isKeyBindings),
      activeTool: createStoredValueDefinition<string | null>(null, isToolId)
    },
    postList: {
      grid: POST_GRID,
      lightbox: LIGHTBOX
    }
  },
  state: {
    favorites: new StoredMapDefinition({
      workspace: createStoredValueDefinition(DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT, FAVORITES_WORKSPACE_SNAPSHOT_CODEC),
      sizes: createStoredValueDefinition(PLACEHOLDER_FAVORITE_SIZES, isSizeList)
    }),
    favoritesSearchHistory: createStoredValueDefinition(NO_QUERIES, createListGuard(isString)),
    favoritesTabStripVisible: createStoredValueDefinition(true),
    favoritesSearchSettingsVisible: createStoredValueDefinition(false)
  }
};

function isToolId(stored: unknown): stored is string | null {
  return stored === null || typeof stored === "string";
}

function isPageSize(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 1;
}
