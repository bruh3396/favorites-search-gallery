import { addTagsToFavorite, removeTagsFromFavorite, resetTagModifications, storeTagModifications, tagModifications } from "../favorites/model/tags/favorites_tag_modifier";
import { insertHtmlWithStyles, insertStyle } from "../../utils/dom/injector";
import { Events } from "../../lib/communication/events";
import { Favorite } from "../../types/favorite";
import { FeatureBridge } from "../../lib/communication/feature_bridge";
import { ITEM_CLASS_NAME } from "../../lib/dom/thumb";
import { ON_FAVORITES_PAGE } from "../../lib/environment/environment";
import { TAG_MODIFIER_DISABLED } from "../../lib/environment/derived_environment";
import { TAG_MODIFIER_HTML } from "../../assets/html";
import { doNothing } from "../../lib/environment/constants";
import { removeExtraWhiteSpace } from "../../utils/string/format";

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

const selected: Set<Favorite> = new Set();
const ui: TagModifierUI = {} as TagModifierUI;
const favoritesOption = {} as { container: HTMLElement, checkbox: HTMLInputElement };
let tagEditModeAbortController = new AbortController();
let atLeastOneFavoriteIsSelected = false;

export function setupTagModifier(): void {
  if (TAG_MODIFIER_DISABLED) {
    return;
  }
  insertHTML();
  addEventListeners();
}

function insertHTML(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  insertHtmlWithStyles(document.getElementById("bottom-panel-3") as HTMLElement, "beforeend", TAG_MODIFIER_HTML);
  favoritesOption.container = document.getElementById("tag-modifier-container") as HTMLElement;
  favoritesOption.checkbox = document.getElementById("tag-modifier-option-checkbox") as HTMLInputElement;
  ui.container = document.getElementById("tag-modifier-ui-container") as HTMLElement;
  ui.statusLabel = document.getElementById("tag-modifier-ui-status-label") as HTMLLabelElement;
  ui.textarea = document.getElementById("tag-modifier-ui-textarea") as HTMLTextAreaElement;
  ui.add = document.getElementById("tag-modifier-ui-add") as HTMLButtonElement;
  ui.remove = document.getElementById("tag-modifier-remove") as HTMLButtonElement;
  ui.reset = document.getElementById("tag-modifier-reset") as HTMLButtonElement;
  ui.selectAll = document.getElementById("tag-modifier-ui-select-all") as HTMLButtonElement;
  ui.unSelectAll = document.getElementById("tag-modifier-ui-un-select-all") as HTMLButtonElement;
  ui.import = document.getElementById("tag-modifier-import") as HTMLButtonElement;
  ui.export = document.getElementById("tag-modifier-export") as HTMLButtonElement;
}

function addEventListeners(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  favoritesOption.checkbox.onchange = (event): void => {
    if (event.target instanceof HTMLInputElement) {
      toggleTagEditMode(event.target.checked);
    }
  };
  ui.selectAll.onclick = selectAll;
  ui.unSelectAll.onclick = unSelectAll;
  ui.add.onclick = addTagsToSelected;
  ui.remove.onclick = removeTagsFromSelected;
  ui.reset.onclick = (): void => {
    if (!confirm("Are you sure you want to delete all tag modifications?")) {
      return;
    }
    resetTagModifications();
    Events.tagModifier.resetConfirmed.emit();
  };
  ui.import.onclick = doNothing;
  ui.export.onclick = doNothing;
  Events.favorites.searchResultsUpdated.on(() => {
    unSelectAll();
  });
  Events.favorites.pageChanged.on(() => {
    highlightSelectedThumbsOnPageChange();
  });
}

function getSelectedFavoritesOnPage(): Favorite[] {
  const results = FeatureBridge.favoritesSearchResults.query();
  return results.filter(favorite => document.getElementById(favorite.id) !== null && isSelected(favorite));
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
  ui.unSelectAll.click();
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
  insertStyle(html, "tag-edit-mode");
}

function toggleUI(value: boolean): void {
  ui.container.style.display = value ? "block" : "none";
}

function getFavorite(id: string): Favorite | undefined {
  return FeatureBridge.favoritesSearchResults.query().find(favorite => favorite.id === id);
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
  ui.statusLabel.style.visibility = "visible";
  ui.statusLabel.textContent = text;
  setTimeout(() => {
    const statusHasNotChanged = ui.statusLabel.textContent === text;

    if (statusHasNotChanged) {
      ui.statusLabel.style.visibility = "hidden";
    }
  }, 1000);
}

function unSelectAll(): void {
  if (!atLeastOneFavoriteIsSelected) {
    return;
  }

  for (const favorite of selected) {
    select(favorite, false);
  }
  atLeastOneFavoriteIsSelected = false;
}

function selectAll(): void {
  for (const favorite of FeatureBridge.favoritesSearchResults.query()) {
    select(favorite, true);
  }
}

function select(favorite: Favorite, value?: boolean): void {
  atLeastOneFavoriteIsSelected = true;

  if (value === undefined) {
    value = !selected.has(favorite);
  }

  if (value) {
    selected.add(favorite);
  } else {
    selected.delete(favorite);
  }
  toggleOutline(favorite, value);
}

function toggleOutline(favorite: Favorite, value: boolean): void {
  if (document.getElementById(favorite.id) !== null || !value) {
    favorite.root.classList.toggle("tag-modifier-selected", value);
  }
}

function isSelected(favorite: Favorite): boolean {
  return selected.has(favorite);
}

function removeMediaTypeTags(tags: string): string {
  return tags.replace(/(?:^|\s*)(?:video|animated|mp4)(?:$|\s*)/g, "");
}

function addTagsToSelected(): void {
  modifyTagsOfSelected(false);
}

function removeTagsFromSelected(): void {
  modifyTagsOfSelected(true);
}

function modifyTagsOfSelected(remove: boolean): void {
  const tags = ui.textarea.value.toLowerCase();
  const tagsWithoutMediaTypes = removeMediaTypeTags(tags);
  const tagsToModify = removeExtraWhiteSpace(tagsWithoutMediaTypes);
  const statusPrefix = remove ? "Removed tag(s) from" : "Added tag(s) to";
  let modifiedTagsCount = 0;

  if (tagsToModify === "") {
    return;
  }

  for (const favorite of selected) {
    const additionalTags = remove ? removeTagsFromFavorite(favorite, tagsToModify) : addTagsToFavorite(favorite, tagsToModify);

    tagModifications.set(favorite.id, additionalTags);
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
  FeatureBridge.setCustomTags.query(tagsToModify);
  storeTagModifications();
}
