import { Codec, createListCodec, createRecordCodec } from "@/core/utils/codec/codec";
import { DEFAULT_FAVORITES_SEARCH_OPTIONS, FavoritesSearchOptions } from "@/core/features/favorites/search/favorites_search_options";
import { isBoolean, isRecord } from "@/core/utils/guard/unknown_utilities";
import { FAVORITES_SORT_KEYS } from "@/core/features/favorites/search/favorites_sort_key";
import { FieldGuards } from "@/core/utils/guard/field_guards";
import { createOneOfGuard } from "@/core/utils/guard/one_of_guard";
import { createSameKindGuard } from "@/core/utils/guard/same_kind_guard";
import { isPostStatusMask } from "@/core/domain/post/post_status_mask";
import { isRatingMask } from "@/core/domain/post/rating_mask";

interface TabGroup {
  readonly favoritesSearchOptions: readonly FavoritesSearchOptions[];
  readonly activeIndex: number;
}

export interface FavoritesWorkspaceSnapshot {
  readonly tabGroups: readonly TabGroup[];
}

export const DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT: FavoritesWorkspaceSnapshot = {
  tabGroups: [{ favoritesSearchOptions: [DEFAULT_FAVORITES_SEARCH_OPTIONS], activeIndex: 0 }]
};
const FAVORITES_SEARCH_OPTIONS_GUARDS: FieldGuards<FavoritesSearchOptions> = {
  query: createSameKindGuard(""),
  isInverted: isBoolean,
  sortKey: createOneOfGuard(FAVORITES_SORT_KEYS),
  isSortAscending: isBoolean,
  allowedRatings: isRatingMask,
  allowedStatuses: isPostStatusMask,
  isBlacklistEnabled: isBoolean,
  isShuffled: isBoolean,
  shuffleSeed: isSeed
};
const TABS_CODEC = createListCodec(createRecordCodec(DEFAULT_FAVORITES_SEARCH_OPTIONS, FAVORITES_SEARCH_OPTIONS_GUARDS));
const TAB_GROUPS_CODEC = createListCodec<TabGroup>({
  decode: (stored): TabGroup | undefined => {
    if (!isRecord(stored)) {
      return undefined;
    }
    const favoritesSearchOptions = TABS_CODEC.decode(stored.favoritesSearchOptions);
    return favoritesSearchOptions !== undefined && favoritesSearchOptions.length > 0 ? {
      favoritesSearchOptions,
      activeIndex: decodeActiveIndex(stored.activeIndex, favoritesSearchOptions.length)
    } : undefined;
  },
  encode: (tabGroup): unknown => ({ favoritesSearchOptions: TABS_CODEC.encode(tabGroup.favoritesSearchOptions), activeIndex: tabGroup.activeIndex })
});

export const FAVORITES_WORKSPACE_SNAPSHOT_CODEC: Codec<FavoritesWorkspaceSnapshot> = {
  decode: (stored): FavoritesWorkspaceSnapshot | undefined => {
    const tabGroups = isRecord(stored) ? TAB_GROUPS_CODEC.decode(stored.tabGroups) : undefined;
    return tabGroups !== undefined && tabGroups.length > 0 ? { tabGroups } : undefined;
  },
  encode: (favoritesWorkspaceSnapshot): unknown => ({ tabGroups: TAB_GROUPS_CODEC.encode(favoritesWorkspaceSnapshot.tabGroups) })
};

function isSeed(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 0;
}

function decodeActiveIndex(stored: unknown, tabCount: number): number {
  return typeof stored === "number" && Number.isInteger(stored) && stored >= 0 && stored < tabCount ? stored : 0;
}
