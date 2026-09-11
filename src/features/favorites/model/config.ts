import { NEGATED_BLACKLISTED_TAGS, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "@/lib/environment";
import { Rating, SortKey } from "@/types/search";
import { Preferences } from "@/app/context/preferences";
import { SearcherConfig } from "@/features/favorites/model/search/searcher";

export function searcherConfig(): SearcherConfig {
  return {
    usingBlacklist: (): boolean => !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.favorites.excludeBlacklist.value,
    enforcingBlacklist: (): boolean => !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE,
    blacklistTags: NEGATED_BLACKLISTED_TAGS,
    allowedRatings: (): Rating => Preferences.favorites.allowedRatings.value,
    sortKey: (): SortKey => Preferences.favorites.sortKey.value,
    sortAscending: (): boolean => Preferences.favorites.sortAscending.value
  };
}
