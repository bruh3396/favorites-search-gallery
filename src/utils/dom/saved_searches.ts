export function getSavedSearches(): string[] {
  return Array.from(document.getElementsByClassName("save-search-label"))
    .filter(element => element instanceof HTMLElement)
    .map(element => element.innerText);
}
