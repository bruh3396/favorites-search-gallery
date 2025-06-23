import { AwesompleteSuggestion } from "../../types/primitives/composites";
import { getSavedSearches } from "../../utils/dom/saved_searches";
import { removeExtraWhiteSpace } from "../../utils/primitive/string";

const SUGGESTION_LIMIT = 5;
const MIN_TAG_LENGTH = 3;

export function savedSearchMatchesSearchTag(searchTag: string, savedSearch: string): boolean {
  const sanitizedSavedSearch = removeExtraWhiteSpace(savedSearch.replace(/[~())]/g, ""));
  const savedSearchTagList = sanitizedSavedSearch.split(" ");

  for (const savedSearchTag of savedSearchTagList) {
    if (savedSearchTag.startsWith(searchTag)) {
      return true;
    }
  }
  return false;
}

export function getSavedSearchesForAutocompleteList(searchTag: string): AwesompleteSuggestion[] {
  if (searchTag.length < MIN_TAG_LENGTH) {
    return [];
  }
  const matchedSavedSearches: AwesompleteSuggestion[] = [];

  for (const savedSearch of getSavedSearches()) {
    if (matchedSavedSearches.length > SUGGESTION_LIMIT) {
      break;
    }

    if (savedSearchMatchesSearchTag(searchTag, savedSearch)) {
      matchedSavedSearches.push({ label: `${savedSearch}`, value: `${searchTag}_saved_search ${savedSearch}`, type: "saved"});
    }
  }
  return matchedSavedSearches;
}
