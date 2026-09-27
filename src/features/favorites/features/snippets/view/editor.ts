import { Snippet, SnippetScene } from "@/features/favorites/features/snippets/types/types";
import { SnippetShell } from "@/features/favorites/features/snippets/shell/shell";
import { toggleDataset } from "@/utils/browser/dataset";

export class SnippetEditor {
  private readonly shell: SnippetShell;

  constructor(shell: SnippetShell) {
    this.shell = shell;
  }

  public render({ editTarget, failure }: SnippetScene): void {
    const { eyebrow, saveButton, cancelButton, errorMessage, nameField, queryField } = this.shell;
    const isEditing = editTarget !== null;
    const reason = failure?.reason;

    eyebrow.textContent = isEditing ? `Editing /${editTarget}` : "New snippet";
    saveButton.textContent = isEditing ? "Update" : "Save";
    errorMessage.textContent = failure?.message ?? "";
    toggleDataset(cancelButton, "hidden", !isEditing);
    toggleDataset(errorMessage, "hidden", failure === null);
    toggleDataset(saveButton, "disabled", failure !== null);
    toggleDataset(nameField, "invalid", reason === "empty-name" || reason === "duplicate-name");
    toggleDataset(queryField, "invalid", reason === "empty-query");
  }

  public fill(snippet: Snippet): void {
    this.shell.nameField.value = snippet.name;
    this.shell.queryField.value = snippet.query;
    this.shell.nameField.focus();
  }

  public clear(): void {
    this.shell.nameField.value = "";
    this.shell.queryField.value = "";
  }

  public setQuery(query: string): void {
    this.shell.queryField.value = query;
    this.shell.queryField.focus();
  }
}
