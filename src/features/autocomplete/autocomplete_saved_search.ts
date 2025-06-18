import { removeExtraWhiteSpace } from "../../utils/primitive/string";

export function getSavedSearches(): string[] {
  return Array.from(document.getElementsByClassName("save-search-label"))
    .filter(element => element instanceof HTMLElement)
    .map(element => element.innerText);
}

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

export function getSavedSearchesForAutocompleteList(searchTag: string): { label: string; value: string; type: string }[] {
  const minimumSearchTagLength = 3;

  if (searchTag.length < minimumSearchTagLength) {
    return [];
  }
  const maxMatchedSavedSearches = 5;
  const matchedSavedSearches = [];

  for (const savedSearch of getSavedSearches()) {
    if (matchedSavedSearches.length > maxMatchedSavedSearches) {
      break;
    }

    if (savedSearchMatchesSearchTag(searchTag, savedSearch)) {
      matchedSavedSearches.push({
        label: `${savedSearch}`,
        value: `${searchTag}_saved_search ${savedSearch}`,
        // value: `${searchTag}_saved_search ${savedSearch}`,
        type: "saved"
      });
    }
  }
  return matchedSavedSearches;
}
