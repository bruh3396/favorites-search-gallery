import * as TagModifierEditMode from "./edit_mode";
import * as TagModifierOperations from "./operations";
import * as TagModifierSelection from "./selection";
import * as TagModifierStore from "./store";
import { Favorite } from "../../../../types/favorite";
import { TAG_MODIFIER_DISABLED } from "../../../../lib/environment/derived_environment";
import TAG_MODIFIER_CSS from "../../../../assets/css/tag_modifier.css";
import TAG_MODIFIER_HTML from "../../../../assets/html/tag_modifier.html";
import { doNothing } from "../../../../lib/environment/constants";
import { insertHTML, insertStyle } from "../../../../lib/dom/injector";

export type FavoritesTagModifierInterface = {
  getSearchResults: () => Favorite[]
  getAllFavorites: () => Favorite[]
  deIndex: (favorite: Favorite) => void
  reIndex: (favorite: Favorite) => void
}

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

const ui: TagModifierUI = {} as TagModifierUI;
const favoritesOption = {} as { container: HTMLElement, checkbox: HTMLInputElement };
let tagModifierInterface: FavoritesTagModifierInterface;

export async function setupFavoritesTagModifier(tmInterface: FavoritesTagModifierInterface): Promise<void> {
  if (TAG_MODIFIER_DISABLED) {
    return;
  }
  tagModifierInterface = tmInterface;
  insertTagModifierShell();
  TagModifierSelection.initializeSelection(tmInterface.getSearchResults);
  TagModifierEditMode.initializeTagEditMode(
    (id) => tmInterface.getSearchResults().find(f => f.id === id),
    (value) => {
      ui.container.style.display = value ? "block" : "none";
    }
  );
  TagModifierOperations.initializeTagOperations(tmInterface.deIndex, tmInterface.reIndex, () => ui.statusLabel);
  await TagModifierStore.loadTagModifications();
  addEventListeners();
}

export { handleDocumentClick } from "./edit_mode";
export { highlightSelectedThumbsOnPageChange, unselectAll } from "./selection";
export { getTagModification as getAdditionalTags } from "./store";

function insertTagModifierShell(): void {
  insertStyle(TAG_MODIFIER_CSS);
  insertHTML(document.getElementById("bottom-panel-3") as HTMLElement, "beforeend", TAG_MODIFIER_HTML);
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
  favoritesOption.checkbox.onchange = (event): void => {
    if (event.target instanceof HTMLInputElement) {
      TagModifierEditMode.toggleTagEditMode(event.target.checked);
    }
  };
  ui.selectAll.onclick = TagModifierSelection.selectAll;
  ui.unSelectAll.onclick = TagModifierSelection.unselectAll;
  ui.add.onclick = (): void => TagModifierOperations.addTagsToSelected(TagModifierSelection.getSelected(), ui.textarea.value);
  ui.remove.onclick = (): void => TagModifierOperations.removeTagsFromSelected(TagModifierSelection.getSelected(), ui.textarea.value);
  ui.reset.onclick = (): void => {
    if (!confirm("Are you sure you want to delete all tag modifications?")) {
      return;
    }
    TagModifierStore.resetTagModifications();
    TagModifierOperations.resetAllFavoriteTags(tagModifierInterface.getAllFavorites());
  };
  ui.import.onclick = doNothing;
  ui.export.onclick = doNothing;
}
