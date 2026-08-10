import * as SnippetActions from "@/features/favorites/features/snippets/actions";
import * as SnippetEditor from "@/features/favorites/features/snippets/editor";
import * as SnippetView from "@/features/favorites/features/snippets/view";
import { exportSnippets, importSnippets } from "@/features/favorites/features/snippets/transfer";
import { FavoritesDrawerViewContent } from "@/types/favorite";
import { SnippetState } from "@/features/favorites/features/snippets/state";
import { SnippetStore } from "@/features/favorites/features/snippets/store";
import { Storage } from "@/lib/storage/local_storage";
import { setHandlers } from "@/features/favorites/features/snippets/handlers";

const store = new SnippetStore(Storage);

let appendToSearch: (text: string) => void = () => { };

export function setup(appendSnippetToSearch: (text: string) => void): void {
  appendToSearch = appendSnippetToSearch;
  setHandlers({
    onUse: useSnippet,
    onEdit: editSnippet,
    onDelete: deleteSnippet,
    onDeleteRequested: requestDelete,
    onDeleteCancelled: cancelDelete,
    onSave: saveSnippet,
    onEditCancelled: cancelEdit,
    onEditorInput: clearFailure,
    onFiltered: SnippetView.render
  });
  refresh();
}

export function mount(): FavoritesDrawerViewContent {
  return {
    mount: SnippetView.mount,
    actions: [
      SnippetActions.importButton(importFromFile),
      SnippetActions.exportButton(exportToFile),
      SnippetActions.deleteAllButton(deleteAllSnippets)
    ]
  };
}

function useSnippet(name: string): void {
  const snippet = store.get(name);

  if (snippet === undefined) {
    return;
  }
  appendToSearch(snippet.query);
  store.use(name);
  refresh();
}

function editSnippet(name: string): void {
  const snippet = store.get(name);

  if (snippet === undefined) {
    return;
  }
  SnippetState.editTarget = name;
  SnippetState.deleteTarget = null;
  SnippetState.saveFailure = null;
  SnippetEditor.fill(snippet);
  SnippetView.render();
}

function saveSnippet(): void {
  const target = SnippetState.editTarget;
  const result = target === null ? store.add(SnippetEditor.name(), SnippetEditor.query()) : store.update(target, SnippetEditor.name(), SnippetEditor.query());

  if (!result.ok) {
    SnippetState.saveFailure = result.reason;
    SnippetView.render();
    return;
  }
  clearEditor();
  refresh();
}

function cancelEdit(): void {
  clearEditor();
  SnippetView.render();
}

function requestDelete(name: string): void {
  SnippetState.deleteTarget = name;
  SnippetView.render();
}

function cancelDelete(): void {
  SnippetState.deleteTarget = null;
  SnippetView.render();
}

function deleteSnippet(name: string): void {
  store.remove(name);
  SnippetState.deleteTarget = null;

  if (SnippetState.editTarget === name) {
    clearEditor();
  }
  refresh();
}

function deleteAllSnippets(): void {
  const count = store.getAll().length;

  if (count === 0) {
    alert("No snippets to delete");
    return;
  }

  if (!confirm(`Delete all ${count} snippets?`)) {
    return;
  }
  store.replaceAll([]);
  SnippetState.deleteTarget = null;
  clearEditor();
  refresh();
}

function clearFailure(): void {
  if (SnippetState.saveFailure !== null) {
    SnippetState.saveFailure = null;
    SnippetView.render();
  }
}

function exportToFile(): void {
  exportSnippets(store.getAll());
}

function importFromFile(contents: string): void {
  const imported = importSnippets(contents);

  if (imported.length === 0) {
    alert("No snippets found in that file");
    return;
  }

  if (store.getAll().length > 0 && !confirm(`Replace all snippets with ${imported.length} from this file?`)) {
    return;
  }
  store.replaceAll(imported);
  clearEditor();
  refresh();
}

function clearEditor(): void {
  SnippetState.editTarget = null;
  SnippetState.saveFailure = null;
  SnippetEditor.clear();
}

function refresh(): void {
  SnippetState.snippets = store.getAll();
  SnippetView.render();
}
