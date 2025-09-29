import { TAG_MODIFICATIONS, resetTagModifications, storeTagModifications } from "../../lib/global/tag_modifier";
import { insertHTMLAndExtractStyle, insertStyleHTML } from "../../utils/dom/style";
import { DO_NOTHING } from "../../utils/misc/async";
import { Events } from "../../lib/global/events/events";
import { Favorite } from "../../types/interfaces/interfaces";
import { ITEM_CLASS_NAME } from "../../utils/dom/dom";
import { ON_FAVORITES_PAGE } from "../../lib/global/flags/intrinsic_flags";
import { TAG_MODIFIER_ENABLED } from "../../lib/global/flags/derived_flags";
import { TAG_MODIFIER_HTML } from "../../assets/html";
import { removeExtraWhiteSpace } from "../../utils/primitive/string";
import { setCustomTags } from "../../lib/global/custom_tags";

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

const SELECTED: Set<Favorite> = new Set();
const UI: TagModifierUI = {} as TagModifierUI;
const FAVORITES_OPTION = {} as { container: HTMLElement, checkbox: HTMLInputElement };
let tagEditModeAbortController = new AbortController();
let latestSearchResults: Favorite[] = [];
let atLeastOneFavoriteIsSelected = false;

export function setupTagModifier(): void {
  if (TAG_MODIFIER_ENABLED) {
    insertHTML();
    addEventListeners();
  }
}

function insertHTML(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  insertHTMLAndExtractStyle(document.getElementById("bottom-panel-4") as HTMLElement, "beforeend", TAG_MODIFIER_HTML);
  FAVORITES_OPTION.container = document.getElementById("tag-modifier-container") as HTMLElement;
  FAVORITES_OPTION.checkbox = document.getElementById("tag-modifier-option-checkbox") as HTMLInputElement;
  UI.container = document.getElementById("tag-modifier-ui-container") as HTMLElement;
  UI.statusLabel = document.getElementById("tag-modifier-ui-status-label") as HTMLLabelElement;
  UI.textarea = document.getElementById("tag-modifier-ui-textarea") as HTMLTextAreaElement;
  UI.add = document.getElementById("tag-modifier-ui-add") as HTMLButtonElement;
  UI.remove = document.getElementById("tag-modifier-remove") as HTMLButtonElement;
  UI.reset = document.getElementById("tag-modifier-reset") as HTMLButtonElement;
  UI.selectAll = document.getElementById("tag-modifier-ui-select-all") as HTMLButtonElement;
  UI.unSelectAll = document.getElementById("tag-modifier-ui-un-select-all") as HTMLButtonElement;
  UI.import = document.getElementById("tag-modifier-import") as HTMLButtonElement;
  UI.export = document.getElementById("tag-modifier-export") as HTMLButtonElement;
}

function addEventListeners(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  FAVORITES_OPTION.checkbox.onchange = (event): void => {
    if (event.target instanceof HTMLInputElement) {
      toggleTagEditMode(event.target.checked);
    }
  };
  UI.selectAll.onclick = selectAll;
  UI.unSelectAll.onclick = unSelectAll;
  UI.add.onclick = addTagsToSelected;
  UI.remove.onclick = removeTagsFromSelected;
  UI.reset.onclick = resetTagModifications;
  UI.import.onclick = DO_NOTHING;
  UI.export.onclick = DO_NOTHING;
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

function getSelectedFavoritesOnPage(): Favorite[] {
  return latestSearchResults.filter(favorite => document.getElementById(favorite.id) !== null && isSelected(favorite));
}

function highlightSelectedThumbsOnPageChange(): void {
  if (atLeastOneFavoriteIsSelected) {
    for (const favorite of getSelectedFavoritesOnPage()) {
      toggleOutline(favorite, true);
    }
  }
}

function toggleTagEditMode(value: boolean): void {
  toggleThumbInteraction(value);
  toggleUI(value);
  toggleTagEditModeEventListeners(value);
  UI.unSelectAll.click();
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
  UI.container.style.display = value ? "block" : "none";
}

function getFavorite(id: string): Favorite | undefined {
  return latestSearchResults.find(favorite => favorite.id === id);
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
      select(favorite);
    }
  }, {
    signal: tagEditModeAbortController.signal
  });
}

function showStatus(text: string): void {
  UI.statusLabel.style.visibility = "visible";
  UI.statusLabel.textContent = text;
  setTimeout(() => {
    const statusHasNotChanged = UI.statusLabel.textContent === text;

    if (statusHasNotChanged) {
      UI.statusLabel.style.visibility = "hidden";
    }
  }, 1000);
}

function unSelectAll(): void {
  if (!atLeastOneFavoriteIsSelected) {
    return;
  }

  for (const favorite of SELECTED) {
    select(favorite, false);
  }
  atLeastOneFavoriteIsSelected = false;
}

function selectAll(): void {
  for (const favorite of latestSearchResults) {
    select(favorite, true);
  }
}

function select(favorite: Favorite, value?: boolean): void {
  atLeastOneFavoriteIsSelected = true;

  if (value === undefined) {
    value = !SELECTED.has(favorite);
  }

  if (value) {
    SELECTED.add(favorite);
  } else {
    SELECTED.delete(favorite);
  }
  toggleOutline(favorite, value);
}

function toggleOutline(favorite: Favorite, value: boolean): void {
  if (document.getElementById(favorite.id) !== null || !value) {
    favorite.root.classList.toggle("tag-modifier-selected", value);
  }
}

function isSelected(favorite: Favorite): boolean {
  return SELECTED.has(favorite);
}

function removeContentTypeTags(tags: string): string {
  return tags.replace(/(?:^|\s*)(?:video|animated|mp4)(?:$|\s*)/g, "");
}

function addTagsToSelected(): void {
  modifyTagsOfSelected(false);
}

function removeTagsFromSelected(): void {
  modifyTagsOfSelected(true);
}

function modifyTagsOfSelected(remove: boolean): void {
  const tags = UI.textarea.value.toLowerCase();
  const tagsWithoutContentTypes = removeContentTypeTags(tags);
  const tagsToModify = removeExtraWhiteSpace(tagsWithoutContentTypes);
  const statusPrefix = remove ? "Removed tag(s) from" : "Added tag(s) to";
  let modifiedTagsCount = 0;

  if (tagsToModify === "") {
    return;
  }

  for (const favorite of SELECTED) {
    const additionalTags = remove ? favorite.removeAdditionalTags(tagsToModify) : favorite.addAdditionalTags(tagsToModify);

    TAG_MODIFICATIONS.set(favorite.id, additionalTags);
    modifiedTagsCount += 1;
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
