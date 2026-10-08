import { ALL_RATINGS_MASK, isRatingMask } from "@/core/domain/post/post";
import { Preference, PreferenceStorage, StoredPreference } from "@/core/utils/reactive/preference";
import { SORT_KEYS, SearchSettings } from "@/core/features/favorites/search/settings";
import { isBoolean, oneOf, sameKindAs } from "@/core/utils/guards/guards";
import { PaginationSettings } from "@/core/features/favorites/search/pagination";
import { createFieldsCodec } from "@/core/utils/codec/codec";

const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  query: "",
  isInverted: false,
  sortKey: "favorited",
  isSortAscending: false,
  allowedRatings: ALL_RATINGS_MASK,
  isBlacklistEnabled: false,
  isShuffled: false,
  shuffleSeed: 0
};
const SEARCH_SETTINGS_CODEC = createFieldsCodec<SearchSettings>({
  query: sameKindAs(""),
  isInverted: isBoolean,
  sortKey: oneOf(SORT_KEYS),
  isSortAscending: isBoolean,
  allowedRatings: isRatingMask,
  isBlacklistEnabled: isBoolean,
  isShuffled: isBoolean,
  shuffleSeed: isSeed
});
const DEFAULT_PAGINATION_SETTINGS: PaginationSettings = { size: 50, infiniteScroll: false };
const PAGINATION_SETTINGS_CODEC = createFieldsCodec<PaginationSettings>({ size: isPageSize, infiniteScroll: isBoolean });

export function createSearchSettings(storage: PreferenceStorage): Preference<SearchSettings> {
  return new StoredPreference(
    { key: "favoritesSearch", defaultValue: DEFAULT_SEARCH_SETTINGS },
    {
      storage,
      codec: {
        decode: (stored): SearchSettings => ({ ...DEFAULT_SEARCH_SETTINGS, ...SEARCH_SETTINGS_CODEC.decode(stored) }),
        encode: (settings): unknown => SEARCH_SETTINGS_CODEC.encode(settings)
      }
    }
  );
}

export function createPaginationSettings(storage: PreferenceStorage): Preference<PaginationSettings> {
  return new StoredPreference(
    { key: "favoritesPagination", defaultValue: DEFAULT_PAGINATION_SETTINGS },
    {
      storage,
      codec: {
        decode: (stored): PaginationSettings => ({ ...DEFAULT_PAGINATION_SETTINGS, ...PAGINATION_SETTINGS_CODEC.decode(stored) }),
        encode: (settings): unknown => PAGINATION_SETTINGS_CODEC.encode(settings)
      }
    }
  );
}

function isPageSize(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 1;
}

function isSeed(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 0;
}
