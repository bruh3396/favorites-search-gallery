import { RATINGS } from "@/core/domain/post/post";
import { SearchCriteria } from "@/core/features/favorites/types/search";

export function createSearchCriteria(overrides: Partial<SearchCriteria> = {}): SearchCriteria {
  return {
    query: "",
    sort: { key: "favorited", isAscending: false },
    allowedRatings: new Set(RATINGS),
    blacklistQuery: "",
    shuffleSeed: 1,
    ...overrides
  };
}
