export function getSavedSearches(): string[] {
  return Array.from(document.getElementsByClassName("saved-searches__item-label"))
    .filter(element => element instanceof HTMLElement)
    .map(element => element.innerText);
}
