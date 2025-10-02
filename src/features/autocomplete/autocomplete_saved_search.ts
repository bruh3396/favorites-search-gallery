import { AwesompleteSuggestion } from "../../types/common_types";
import { getSavedSearches } from "../../utils/dom/saved_searches";
import { removeExtraWhiteSpace } from "../../utils/primitive/string";

const SUGGESTION_LIMIT = 5;
const MIN_TAG_LENGTH = 3;

function getSavedSearchTagList(savedSearch: string): string[] {
  return removeExtraWhiteSpace(savedSearch.replace(/[~())]/g, "")).split(" ");
}

function createAwesompleteSuggestion(searchTag: string, savedSearch: string): AwesompleteSuggestion {
  return {
    label: savedSearch,
    value: `${searchTag}_saved_search ${savedSearch}`,
    type: "saved"
  };
}

export function savedSearchMatchesSearchTag(searchTag: string, savedSearch: string): boolean {
  return getSavedSearchTagList(savedSearch).some(tag => tag.startsWith(searchTag));
}

export function getSavedSearchesSuggestions(searchTag: string): AwesompleteSuggestion[] {
  if (searchTag.length < MIN_TAG_LENGTH) {
    return [];
  }
  return getSavedSearches()
    .filter(savedSearch => savedSearchMatchesSearchTag(searchTag, savedSearch))
    .slice(0, SUGGESTION_LIMIT)
    .map(savedSearch => createAwesompleteSuggestion(searchTag, savedSearch));
}
