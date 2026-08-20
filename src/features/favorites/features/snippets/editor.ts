import { Snippet, SnippetHandlers } from "@/features/favorites/features/snippets/types";
import { failureText, normalizeName } from "@/features/favorites/features/snippets/utils";
import { SnippetSelectors } from "@/features/favorites/features/snippets/selectors";
import { SnippetState } from "@/features/favorites/features/snippets/state";
import { WidgetSelectors } from "@/lib/ui/widgets/selectors";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/browser/factory";
import { markAsNeedingAutocomplete } from "@/lib/ui/autocomplete/awesomplete";
import { rule } from "@/features/favorites/features/snippets/components";
import { toggleDataset } from "@/utils/browser/dataset";

const eyebrow = createElement("div", { className: SnippetSelectors.eyebrow });
const nameField = createElement("input", { className: `${WidgetSelectors.textField} ${SnippetSelectors.field}` });
const queryField = createElement("textarea", { className: `${WidgetSelectors.textField} ${SnippetSelectors.field} ${SnippetSelectors.queryField}` });
const errorMessage = createElement("div", { className: SnippetSelectors.error });
const cancelButton = createElement("button", { className: `${WidgetSelectors.actionButton} ${SnippetSelectors.button}`, textContent: "Cancel" });
const resultsButton = createElement("button", { className: WidgetSelectors.actionButton, textContent: "Results" });
const saveButton = createElement("button", { className: `${WidgetSelectors.actionButton} ${SnippetSelectors.primaryButton}`, textContent: "Save" });
let handlers: SnippetHandlers;

export function setup(snippetHandlers: SnippetHandlers): void {
  handlers = snippetHandlers;
}

export function build(): HTMLElement {
  nameField.type = "text";
  nameField.placeholder = "name";
  nameField.spellcheck = false;
  nameField.autocomplete = "off";
  queryField.placeholder = "query";
  queryField.spellcheck = false;
  queryField.autocomplete = "off";
  markAsNeedingAutocomplete(queryField);
  saveButton.type = "button";
  cancelButton.type = "button";
  resultsButton.type = "button";
  addTooltip(resultsButton, "Query from search results");
  saveButton.addEventListener("click", () => handlers.onSave());
  resultsButton.addEventListener("click", () => handlers.onResultsQueryRequested());
  cancelButton.addEventListener("click", () => handlers.onEditCancelled());
  nameField.addEventListener("input", onNameInput);
  queryField.addEventListener("input", () => handlers.onEditorInput());
  nameField.addEventListener("keydown", onKeyDown);
  queryField.addEventListener("keydown", onKeyDown);
  return createElement("div", {
    className: SnippetSelectors.footer,
    children: [rule(), eyebrow, fields()]
  });
}

export function render(): void {
  const isEditing = SnippetState.editTarget !== null;
  const failure = SnippetState.saveFailure;

  eyebrow.textContent = isEditing ? `Editing /${SnippetState.editTarget}` : "New snippet";
  saveButton.textContent = isEditing ? "Update" : "Save";
  errorMessage.textContent = failure === null ? "" : failureText(failure, normalizeName(nameField.value));
  toggleDataset(cancelButton, "hidden", !isEditing);
  toggleDataset(errorMessage, "hidden", failure === null);
  toggleDataset(saveButton, "disabled", failure !== null);
  toggleDataset(nameField, "invalid", failure === "empty-name" || failure === "duplicate-name");
  toggleDataset(queryField, "invalid", failure === "empty-query");
}

export function fill(snippet: Snippet): void {
  nameField.value = snippet.name;
  queryField.value = snippet.query;
  nameField.focus();
}

export function clear(): void {
  nameField.value = "";
  queryField.value = "";
}

export function setQuery(value: string): void {
  queryField.value = value;
  queryField.focus();
}

export function name(): string {
  return nameField.value;
}

export function query(): string {
  return queryField.value;
}

function onNameInput(): void {
  const normalized = normalizeName(nameField.value);

  if (normalized !== nameField.value) {
    nameField.value = normalized;
  }
  handlers.onEditorInput();
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Escape" || SnippetState.editTarget === null) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  handlers.onEditCancelled();
}

function fields(): HTMLElement {
  return createElement("div", {
    className: SnippetSelectors.editor,
    children: [
      nameField,
      errorMessage,
      queryField,
      createElement("div", { className: SnippetSelectors.editorActions, children: [cancelButton, resultsButton, saveButton] })
    ]
  });
}
