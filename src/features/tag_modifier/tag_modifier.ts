import { ITEM_CLASS_NAME, getAllThumbs } from "../../utils/dom/dom";
import { clearCustomTags, setCustomTags } from "../../lib/global/custom_tags";
import { getAllFavorites, getFavorite } from "../favorites/types/favorite/favorite_item";
import { insertHTMLAndExtractStyle, insertStyleHTML } from "../../utils/dom/style";
import { DO_NOTHING } from "../../config/constants";
import { Database } from "../../store/indexed_db/database";
import { Events } from "../../lib/global/events/events";
import { Favorite } from "../../types/interfaces/interfaces";
import { ON_FAVORITES_PAGE } from "../../lib/global/flags/intrinsic_flags";
import { TAG_MODIFIER_DISABLED } from "../../lib/global/flags/derived_flags";
import { TAG_MODIFIER_HTML } from "../../assets/html";
import { TagModificationDatabaseRecord } from "../../types/primitives/composites";
import { removeExtraWhiteSpace } from "../../utils/primitive/string";

type TagModifierUI = {
  container: HTMLElement
  textarea: HTMLTextAreaElement
  statusLabel: HTMLLabelElement
  add: HTMLButtonElement
  remove: HTMLButtonElement
  reset: HTMLButtonElement
  selectAll: HTMLButtonElement
  unSelectAll: HTMLButtonElement
  import: HTMLButtonElement
  export: HTMLButtonElement
}

const databaseName = "AdditionalTags";
const objectStoreName = "additionalTags";
const tagModifications: Map<string, string> = new Map();
const database = new Database<TagModificationDatabaseRecord>(databaseName, objectStoreName, 12);

let tagEditModeAbortController: AbortController;
/** @type {{container: HTMLElement, checkbox: HTMLInputElement}} */
let favoritesOption: { container: HTMLElement, checkbox: HTMLInputElement };
let favoritesUI: TagModifierUI;
let latestSearchResults: Favorite[] = [];
let atLeastOneFavoriteIsSelected: boolean;
const selection: Set<Favorite> = new Set();

export function currentlyModifyingTags(): boolean {
  return document.getElementById("tag-edit-mode") !== null;
}

function getDatabaseRecords(): TagModificationDatabaseRecord[] {
  return Array.from(tagModifications.entries())
    .map((entry) => ({
      id: entry[0],
      tags: entry[1]
    }));
}

function storeTagModifications(): void {
  database.store(getDatabaseRecords());
}

async function loadTagModifications(): Promise<void> {
  const records = await database.load();

  for (const record of records) {
    tagModifications.set(record.id, record.tags);
  }
}

export function setupTagModifier(): void {
  if (TAG_MODIFIER_DISABLED) {
    return;
  }
  loadTagModifications();

  tagEditModeAbortController = new AbortController();
  favoritesOption = {} as { container: HTMLDivElement, checkbox: HTMLInputElement };
  favoritesUI = {} as TagModifierUI;
  atLeastOneFavoriteIsSelected = false;
  insertHTML();
  addEventListeners();
}

function insertHTML(): void {
  insertFavoritesPageHTML();
}

function insertFavoritesPageHTML(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  insertHTMLAndExtractStyle(document.getElementById("bottom-panel-4") as HTMLElement, "beforeend", TAG_MODIFIER_HTML);
  favoritesOption.container = document.getElementById("tag-modifier-container") as HTMLElement;
  favoritesOption.checkbox = document.getElementById("tag-modifier-option-checkbox") as HTMLInputElement;
  favoritesUI.container = document.getElementById("tag-modifier-ui-container") as HTMLElement;
  favoritesUI.statusLabel = document.getElementById("tag-modifier-ui-status-label") as HTMLLabelElement;
  favoritesUI.textarea = document.getElementById("tag-modifier-ui-textarea") as HTMLTextAreaElement;
  favoritesUI.add = document.getElementById("tag-modifier-ui-add") as HTMLButtonElement;
  favoritesUI.remove = document.getElementById("tag-modifier-remove") as HTMLButtonElement;
  favoritesUI.reset = document.getElementById("tag-modifier-reset") as HTMLButtonElement;
  favoritesUI.selectAll = document.getElementById("tag-modifier-ui-select-all") as HTMLButtonElement;
  favoritesUI.unSelectAll = document.getElementById("tag-modifier-ui-un-select-all") as HTMLButtonElement;
  favoritesUI.import = document.getElementById("tag-modifier-import") as HTMLButtonElement;
  favoritesUI.export = document.getElementById("tag-modifier-export") as HTMLButtonElement;
}

function addEventListeners(): void {
  addFavoritesPageEventListeners();
}

function addFavoritesPageEventListeners(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  favoritesOption.checkbox.onchange = (event): void => {
    if (event.target instanceof HTMLInputElement) {
      toggleTagEditMode(event.target.checked);
    }
  };
  favoritesUI.selectAll.onclick = selectAll;
  favoritesUI.unSelectAll.onclick = unSelectAll;
  favoritesUI.add.onclick = addTagsToSelected;
  favoritesUI.remove.onclick = removeTagsFromSelected;
  favoritesUI.reset.onclick = resetTagModifications;
  favoritesUI.import.onclick = DO_NOTHING;
  favoritesUI.export.onclick = DO_NOTHING;
  Events.favorites.searchResultsUpdated.on(() => {
    unSelectAll();
  });
  Events.favorites.pageChanged.on(() => {
    highlightSelectedThumbsOnPageChange();
  });
  Events.favorites.searchResultsUpdated.on((searchResults: Favorite[]) => {
    latestSearchResults = searchResults;
  });
}

function highlightSelectedThumbsOnPageChange(): void {
  if (!atLeastOneFavoriteIsSelected) {
    return;
  }
  const favorites = getAllThumbs()
    .map(thumb => getFavorite(thumb.id));

  for (const post of favorites) {
    if (post === undefined) {
      return;
    }

    if (isSelectedForModification(post)) {
      toggleOutline(post, true);
    }
  }
}

function toggleTagEditMode(value: boolean): void {
  toggleThumbInteraction(value);
  toggleUI(value);
  toggleTagEditModeEventListeners(value);
  favoritesUI.unSelectAll.click();
}

function toggleThumbInteraction(value: boolean): void {
  let html = "";

  if (value) {
    html =
      `
      .favorite  {
        cursor: pointer;
        outline: 1px solid black;

        > div,
        >a
        {
          outline: none !important;

          > img {
            outline: none !important;
          }

          pointer-events:none;
          opacity: 0.6;
          filter: grayscale(40%);
          transition: none !important;
        }
      }
    `;
  }
  insertStyleHTML(html, "tag-edit-mode");
}

function toggleUI(value: boolean): void {
  favoritesUI.container.style.display = value ? "block" : "none";
}

function toggleTagEditModeEventListeners(value: boolean): void {
  if (!value) {
    tagEditModeAbortController.abort();
    tagEditModeAbortController = new AbortController();
    return;
  }

  Events.document.click.on((event) => {
    if (!(event.target instanceof HTMLElement) || !event.target.classList.contains(ITEM_CLASS_NAME)) {
      return;
    }
    const favorite = getFavorite(event.target.id);

    if (favorite !== undefined) {
      toggleThumbSelection(favorite);
    }
  }, {
    signal: tagEditModeAbortController.signal
  });
}

function showStatus(text: string): void {
  favoritesUI.statusLabel.style.visibility = "visible";
  favoritesUI.statusLabel.textContent = text;
  setTimeout(() => {
    const statusHasNotChanged = favoritesUI.statusLabel.textContent === text;

    if (statusHasNotChanged) {
      favoritesUI.statusLabel.style.visibility = "hidden";
    }
  }, 1000);
}

function unSelectAll(): void {
  if (!atLeastOneFavoriteIsSelected) {
    return;
  }

  for (const post of getAllFavorites()) {
    toggleThumbSelection(post, false);
  }
  atLeastOneFavoriteIsSelected = false;
}

function selectAll(): void {
  for (const favorite of latestSearchResults) {
    toggleThumbSelection(favorite, true);
  }
}

function toggleThumbSelection(favorite: Favorite, value? : boolean): void {
  atLeastOneFavoriteIsSelected = true;

  if (value === undefined) {
    value = !selection.has(favorite);
  }

  if (value) {
    selection.add(favorite);
  } else {
    selection.delete(favorite);
  }
  toggleOutline(favorite, value);
}

function toggleOutline(favorite: Favorite, value: boolean): void {
  if (document.getElementById(favorite.id) !== null) {
    favorite.root.classList.toggle("tag-modifier-selected", value);
  }
}

function isSelectedForModification(favorite: Favorite): boolean {
  return selection.has(favorite);
}

function removeContentTypeTags(tags: string): string {
  return tags
    .replace(/(?:^|\s*)(?:video|animated|mp4)(?:$|\s*)/g, "");
}

function addTagsToSelected(): void {
  modifyTagsOfSelected(false);
}

function removeTagsFromSelected(): void {
  modifyTagsOfSelected(true);
}

function modifyTagsOfSelected(remove: boolean): void {
  const tags = favoritesUI.textarea.value.toLowerCase();
  const tagsWithoutContentTypes = removeContentTypeTags(tags);
  const tagsToModify = removeExtraWhiteSpace(tagsWithoutContentTypes);
  const statusPrefix = remove ? "Removed tag(s) from" : "Added tag(s) to";
  let modifiedTagsCount = 0;

  if (tagsToModify === "") {
    return;
  }

  for (const favorite of getAllFavorites()) {
    if (isSelectedForModification(favorite)) {
      const additionalTags = remove ? favorite.tags.removeAdditionalTags(tagsToModify) : favorite.tags.addAdditionalTags(tagsToModify);

      tagModifications.set(favorite.id, additionalTags);
      modifiedTagsCount += 1;
    }
  }

  if (modifiedTagsCount === 0) {
    return;
  }

  if (tags !== tagsWithoutContentTypes) {
    alert("Warning: video, animated, and mp4 tags are unchanged.\nThey cannot be modified.");
  }
  showStatus(`${statusPrefix} ${modifiedTagsCount} favorite(s)`);
  dispatchEvent(new Event("modifiedTags"));
  setCustomTags(tagsToModify);
  storeTagModifications();
}

// function restoreMissingCustomTags(): void {
//   const allCustomTags = Array.from(TagModifier.tagModifications.values()).join(" ");
//   // const allUniqueCustomTags = new Set(allCustomTags.split(" "));

//   // Utils.setCustomTags(Array.from(allUniqueCustomTags).join(" "));
// }

function resetTagModifications(): void {
  if (!confirm("Are you sure you want to delete all tag modifications?")) {
    return;
  }
  indexedDB.deleteDatabase("AdditionalTags");
  getAllFavorites().forEach(favorite => {
    favorite.tags.resetAdditionalTags();
  });
  clearCustomTags();
}
