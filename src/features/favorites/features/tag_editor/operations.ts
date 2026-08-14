import { cacheTagEdit, storeTagEdits } from "@/features/favorites/features/tag_editor/store";
import { Favorite } from "@/types/favorite";
import { removeExtraWhiteSpace } from "@/utils/string/format";
import { setCustomTags } from "@/lib/search/tags/custom_tags";

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
  editSelectedTags(selected, tags, false);
}

export function removeTagsFromSelected(selected: Set<Favorite>, tags: string): void {
  editSelectedTags(selected, tags, true);
}

export function resetAllFavoriteTags(favorites: Favorite[]): void {
  favorites.forEach(f => withReIndex(f, () => f.resetAddedTags()));
}

function editSelectedTags(selected: Set<Favorite>, rawTags: string, remove: boolean): void {
  const tags = rawTags.toLowerCase();
  const tagsWithoutMediaTypes = removeMediaTypeTags(tags);
  const tagsToEdit = removeExtraWhiteSpace(tagsWithoutMediaTypes);
  const statusPrefix = remove ? "Removed tag(s) from" : "Added tag(s) to";
  let editedTagsCount = 0;

  if (tagsToEdit === "") {
    return;
  }

  for (const favorite of selected) {
    const addedTags = remove ? removeTagsFromFavorite(favorite, tagsToEdit) : addTagsToFavorite(favorite, tagsToEdit);

    cacheTagEdit(favorite.id, addedTags);
    editedTagsCount += 1;
  }

  if (editedTagsCount === 0) {
    return;
  }

  if (tags !== tagsWithoutMediaTypes) {
    alert("Warning: video, animated, and mp4 tags are unchanged.\nThey cannot be edited.");
  }
  showStatus(`${statusPrefix} ${editedTagsCount} favorite(s)`);
  setCustomTags(tagsToEdit);
  storeTagEdits();
}

function addTagsToFavorite(favorite: Favorite, tags: string): string {
  return withReIndex(favorite, () => favorite.addTags(tags));
}

function removeTagsFromFavorite(favorite: Favorite, tags: string): string {
  return withReIndex(favorite, () => favorite.removeAddedTags(tags));
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
    const hasNotChangedStatus = label.textContent === text;

    if (hasNotChangedStatus) {
      label.style.visibility = "hidden";
    }
  }, 1_000);
}
