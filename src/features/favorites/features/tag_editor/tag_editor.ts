import * as TagEditorEditMode from "@/features/favorites/features/tag_editor/edit_mode";
import * as TagEditorOperations from "@/features/favorites/features/tag_editor/operations";
import * as TagEditorSelection from "@/features/favorites/features/tag_editor/selection";
import * as TagEditorStore from "@/features/favorites/features/tag_editor/store";
import { insertHtml, insertStyle } from "@/utils/dom/injector";
import { Favorite } from "@/types/favorite";
import TAG_EDITOR_CSS from "@/assets/css/favorites/tag_editor.css";
import { TAG_EDITOR_DISABLED } from "@/app/context/flags";
import TAG_EDITOR_HTML from "@/assets/html/tag_modifier.html";
import { doNothing } from "@/utils/function";

type FavoritesTagEditorInterface = {
  getSearchResults: () => Favorite[]
  getAllFavorites: () => Favorite[]
  deIndex: (favorite: Favorite) => void
  reIndex: (favorite: Favorite) => void
}

type TagEditorUi = {
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

const ui: TagEditorUi = {} as TagEditorUi;
const favoritesOption = {} as { container: HTMLElement, checkbox: HTMLInputElement };
let tagEditorInterface: FavoritesTagEditorInterface;

export function setup(tmInterface: FavoritesTagEditorInterface): void {
  if (TAG_EDITOR_DISABLED) {
    return;
  }
  tagEditorInterface = tmInterface;
  insertShell();
  TagEditorSelection.initializeSelection(tmInterface.getSearchResults);
  TagEditorEditMode.initializeTagEditMode(
    (id) => tmInterface.getSearchResults().find(f => f.id === id),
    (value) => {
      ui.container.style.display = value ? "block" : "none";
    }
  );
  TagEditorOperations.initializeTagOperations(tmInterface.deIndex, tmInterface.reIndex, () => ui.statusLabel);
  addEventListeners();
}

export { handleDocumentClick as onDocumentClick } from "@/features/favorites/features/tag_editor/edit_mode";
export { highlightSelectedThumbs as onPageChanged, unselectAll as onResultsUpdated } from "@/features/favorites/features/tag_editor/selection";
export { getTagModification as getAdditionalTags, ensureTagModificationsLoaded } from "@/features/favorites/features/tag_editor/store";

function insertShell(): void {
  insertStyle(TAG_EDITOR_CSS);
  insertHtml(document.getElementById("bottom-panel-3") as HTMLElement, "beforeend", TAG_EDITOR_HTML);
  favoritesOption.container = document.getElementById("tag-editor-container") as HTMLElement;
  favoritesOption.checkbox = document.getElementById("tag-editor-option-checkbox") as HTMLInputElement;
  ui.container = document.getElementById("tag-editor-ui-container") as HTMLElement;
  ui.statusLabel = document.getElementById("tag-editor-ui-status-label") as HTMLLabelElement;
  ui.textarea = document.getElementById("tag-editor-ui-textarea") as HTMLTextAreaElement;
  ui.add = document.getElementById("tag-editor-ui-add") as HTMLButtonElement;
  ui.remove = document.getElementById("tag-editor-remove") as HTMLButtonElement;
  ui.reset = document.getElementById("tag-editor-reset") as HTMLButtonElement;
  ui.selectAll = document.getElementById("tag-editor-ui-select-all") as HTMLButtonElement;
  ui.unSelectAll = document.getElementById("tag-editor-ui-un-select-all") as HTMLButtonElement;
  ui.import = document.getElementById("tag-editor-import") as HTMLButtonElement;
  ui.export = document.getElementById("tag-editor-export") as HTMLButtonElement;
}

function addEventListeners(): void {
  favoritesOption.checkbox.onchange = (event): void => {
    if (event.target instanceof HTMLInputElement) {
      TagEditorEditMode.toggleTagEditMode(event.target.checked);
    }
  };
  ui.selectAll.onclick = TagEditorSelection.selectAll;
  ui.unSelectAll.onclick = TagEditorSelection.unselectAll;
  ui.add.onclick = (): void => TagEditorOperations.addTagsToSelected(TagEditorSelection.getSelected(), ui.textarea.value);
  ui.remove.onclick = (): void => TagEditorOperations.removeTagsFromSelected(TagEditorSelection.getSelected(), ui.textarea.value);
  ui.reset.onclick = (): void => {
    if (!confirm("Are you sure you want to delete all tag modifications?")) {
      return;
    }
    TagEditorStore.destroy();
    TagEditorOperations.resetAllFavoriteTags(tagEditorInterface.getAllFavorites());
  };
  ui.import.onclick = doNothing;
  ui.export.onclick = doNothing;
}
