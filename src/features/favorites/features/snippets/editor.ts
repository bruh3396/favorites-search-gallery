import { failureText, normalizeName } from "@/features/favorites/features/snippets/utils";
import { Snippet } from "@/features/favorites/features/snippets/types";
import { SnippetHandlers } from "@/features/favorites/features/snippets/handlers";
import { SnippetSelectors } from "@/features/favorites/features/snippets/selectors";
import { SnippetState } from "@/features/favorites/features/snippets/state";
import { WidgetSelectors } from "@/lib/ui/widgets/selectors";
import { createElement } from "@/utils/dom/element_factory";
import { rule } from "@/features/favorites/features/snippets/components";
import { toggleDataset } from "@/utils/dom/dataset";

const eyebrow = createElement("div", { className: SnippetSelectors.eyebrow });
const nameField = createElement("input", { className: `${WidgetSelectors.textField} ${SnippetSelectors.field}` });
const queryField = createElement("textarea", { className: `${WidgetSelectors.textField} ${SnippetSelectors.field} ${SnippetSelectors.queryField}` });
const errorMessage = createElement("div", { className: SnippetSelectors.error });
const cancelButton = createElement("button", { className: SnippetSelectors.button, textContent: "Cancel" });
const saveButton = createElement("button", { className: `${SnippetSelectors.button} ${SnippetSelectors.primaryButton}`, textContent: "Save" });

export function build(): HTMLElement {
  nameField.type = "text";
  nameField.placeholder = "name";
  nameField.spellcheck = false;
  nameField.autocomplete = "off";
  queryField.placeholder = "query";
  queryField.spellcheck = false;
  queryField.autocomplete = "off";
  saveButton.type = "button";
  cancelButton.type = "button";
  saveButton.addEventListener("click", () => SnippetHandlers.onSave());
  cancelButton.addEventListener("click", () => SnippetHandlers.onEditCancelled());
  nameField.addEventListener("input", onNameInput);
  queryField.addEventListener("input", () => SnippetHandlers.onEditorInput());
  nameField.addEventListener("keydown", onKeyDown);
  queryField.addEventListener("keydown", onKeyDown);
  return createElement("div", {
    className: SnippetSelectors.footer,
    children: [rule(), eyebrow, fields()]
  });
}

export function render(): void {
  const editing = SnippetState.editTarget !== null;
  const failure = SnippetState.saveFailure;

  eyebrow.textContent = editing ? `Editing /${SnippetState.editTarget}` : "New snippet";
  saveButton.textContent = editing ? "Update" : "Save";
  errorMessage.textContent = failure === null ? "" : failureText(failure, normalizeName(nameField.value));
  toggleDataset(cancelButton, "hidden", !editing);
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
  SnippetHandlers.onEditorInput();
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Escape" || SnippetState.editTarget === null) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  SnippetHandlers.onEditCancelled();
}

function fields(): HTMLElement {
  return createElement("div", {
    className: SnippetSelectors.editor,
    children: [
      nameField,
      errorMessage,
      queryField,
      createElement("div", { className: SnippetSelectors.editorActions, children: [cancelButton, saveButton] })
    ]
  });
}
