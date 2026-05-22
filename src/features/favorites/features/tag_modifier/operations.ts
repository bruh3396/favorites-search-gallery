import { cacheTagModification, storeTagModifications } from "./store";
import { Favorite } from "../../../../types/favorite";
import { removeExtraWhiteSpace } from "../../../../utils/string/format";
import { setCustomTags } from "../../../../lib/search/tags/custom_tags";

let onDeIndex: (favorite: Favorite) => void = () => { };
let onReIndex: (favorite: Favorite) => void = () => { };
let getStatusLabel: () => HTMLLabelElement = () => document.createElement("label");

export function initializeTagOperations(
  deIndex: (favorite: Favorite) => void,
  reIndex: (favorite: Favorite) => void,
  statusLabel: () => HTMLLabelElement
): void {
  onDeIndex = deIndex;
  onReIndex = reIndex;
  getStatusLabel = statusLabel;
}

export function addTagsToSelected(selected: Set<Favorite>, tags: string): void {
  modifyTagsOfSelected(selected, tags, false);
}

export function removeTagsFromSelected(selected: Set<Favorite>, tags: string): void {
  modifyTagsOfSelected(selected, tags, true);
}

export function resetAllFavoriteTags(favorites: Favorite[]): void {
  favorites.forEach(f => withReIndex(f, () => f.resetAdditionalTags()));
}

function modifyTagsOfSelected(selected: Set<Favorite>, rawTags: string, remove: boolean): void {
  const tags = rawTags.toLowerCase();
  const tagsWithoutMediaTypes = removeMediaTypeTags(tags);
  const tagsToModify = removeExtraWhiteSpace(tagsWithoutMediaTypes);
  const statusPrefix = remove ? "Removed tag(s) from" : "Added tag(s) to";
  let modifiedTagsCount = 0;

  if (tagsToModify === "") {
    return;
  }

  for (const favorite of selected) {
    const additionalTags = remove ? removeTagsFromFavorite(favorite, tagsToModify) : addTagsToFavorite(favorite, tagsToModify);

    cacheTagModification(favorite.id, additionalTags);
    modifiedTagsCount += 1;
  }

  if (modifiedTagsCount === 0) {
    return;
  }

  if (tags !== tagsWithoutMediaTypes) {
    alert("Warning: video, animated, and mp4 tags are unchanged.\nThey cannot be modified.");
  }
  showStatus(`${statusPrefix} ${modifiedTagsCount} favorite(s)`);
  dispatchEvent(new Event("modifiedTags"));
  setCustomTags(tagsToModify);
  storeTagModifications();
}

function addTagsToFavorite(favorite: Favorite, tags: string): string {
  return withReIndex(favorite, () => favorite.addAdditionalTags(tags));
}

function removeTagsFromFavorite(favorite: Favorite, tags: string): string {
  return withReIndex(favorite, () => favorite.removeAdditionalTags(tags));
}

function withReIndex<T>(favorite: Favorite, action: () => T): T {
  onDeIndex(favorite);
  const result = action();

  onReIndex(favorite);
  return result;
}

function removeMediaTypeTags(tags: string): string {
  return tags.replace(/(?:^|\s*)(?:video|animated|mp4)(?:$|\s*)/g, "");
}

function showStatus(text: string): void {
  const label = getStatusLabel();

  label.style.visibility = "visible";
  label.textContent = text;
  setTimeout(() => {
    const statusHasNotChanged = label.textContent === text;

    if (statusHasNotChanged) {
      label.style.visibility = "hidden";
    }
  }, 1000);
}
