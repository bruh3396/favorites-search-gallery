import { PreferenceStore, StoredPreference } from "@/core/utils/reactive/preference";
import { RATINGS, Rating } from "@/core/domain/post/post";
import { SORT_KEYS, Sort } from "@/core/features/favorites/types/search";
import { createGuardedCodec, createSetCodec } from "@/core/utils/codec/codec";
import { hasFields, isBoolean, oneOf } from "@/core/utils/guards/guards";
import { FavoritesPreferences } from "@/core/features/favorites/types/favorites";

export function createFavoritesPreferences(store: PreferenceStore): FavoritesPreferences {
  return {
    sort: new StoredPreference<Sort>(
      { key: "favoritesSort", defaultValue: { key: "favorited", isAscending: false } },
      { store, codec: createGuardedCodec(hasFields({ key: oneOf(SORT_KEYS), isAscending: isBoolean })) }
    ),
    allowedRatings: new StoredPreference<ReadonlySet<Rating>>(
      { key: "favoritesAllowedRatings", defaultValue: new Set(RATINGS) },
      { store, codec: createSetCodec(oneOf(RATINGS)) }
    ),
    isBlacklistEnabled: new StoredPreference({ key: "favoritesBlacklistEnabled", defaultValue: true }, { store }),
    resultsPerPage: new StoredPreference({ key: "favoritesResultsPerPage", defaultValue: 50 }, { store }),
    isInfiniteScrollEnabled: new StoredPreference({ key: "favoritesInfiniteScrollEnabled", defaultValue: false }, { store })
  };
}
