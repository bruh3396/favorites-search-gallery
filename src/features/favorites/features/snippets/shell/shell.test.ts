import { describe, expect, test } from "vitest";
import { SnippetShell } from "@/features/favorites/features/snippets/shell/shell";

function editorSlotsOf(shell: SnippetShell): HTMLElement[] {
  const { eyebrow, nameField, queryField, errorMessage, cancelButton, resultsButton, saveButton, editorActions } = shell;
  return [eyebrow, nameField, queryField, errorMessage, cancelButton, resultsButton, saveButton, editorActions];
}

describe("SnippetShell", () => {
  test("mounts every editor slot inside the footer", () => {
    const shell = new SnippetShell();

    for (const slot of editorSlotsOf(shell)) {
      expect(shell.footer.contains(slot)).toBe(true);
    }
  });

  test("hands out a distinct element for every slot", () => {
    const shell = new SnippetShell();
    const slots = [shell.filter, shell.list, shell.footer, ...editorSlotsOf(shell)];

    expect(new Set(slots).size).toBe(slots.length);
  });

  test("puts the editor buttons in the actions slot", () => {
    const { editorActions, cancelButton, resultsButton, saveButton } = new SnippetShell();

    expect([cancelButton, resultsButton, saveButton].every(button => editorActions.contains(button))).toBe(true);
  });

  test("tags each editor button with its action", () => {
    const { cancelButton, resultsButton, saveButton } = new SnippetShell();

    expect([cancelButton, resultsButton, saveButton].map(button => button.dataset.snippetAction)).toEqual(["cancelEdit", "fillQueryFromResults", "save"]);
  });
});
