import { AwesompleteSuggestion } from "@/types/awesomplete";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { removeExtraWhiteSpace } from "@/utils/string/format";

const SUGGESTION_LIMIT = 5;
const MIN_TAG_LENGTH = 3;

export function savedSearchMatchesTag(tag: string, savedSearch: string): boolean {
  return getSavedTagList(savedSearch).some(t => t.startsWith(tag));
}

export function getSavedSearchesSuggestions(tag: string): AwesompleteSuggestion[] {
  if (tag.length < MIN_TAG_LENGTH) {
    return [];
  }
  return FeatureBridge.savedSearches.savedSearches.call()
    .filter(savedSearch => savedSearchMatchesTag(tag, savedSearch))
    .slice(0, SUGGESTION_LIMIT)
    .map(savedSearch => createAwesompleteSuggestion(tag, savedSearch));
}

function getSavedTagList(savedSearch: string): string[] {
  return removeExtraWhiteSpace(savedSearch.replace(/[~())]/g, "")).split(" ");
}

function createAwesompleteSuggestion(tag: string, savedSearch: string): AwesompleteSuggestion {
  return {
    label: savedSearch,
    value: `${tag}_saved_search ${savedSearch}`,
    type: "saved"
  };
}
