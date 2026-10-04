import { createScene, createSnippet } from "@/features/favorites/features/snippets/testing/snippets";
import { describe, expect, test } from "vitest";
import { SnippetEditor } from "@/features/favorites/features/snippets/view/editor";
import { SnippetFailureReason } from "@/features/favorites/features/snippets/types/types";
import { SnippetShell } from "@/features/favorites/features/snippets/shell/shell";

interface Setup {
  editor: SnippetEditor;
  shell: SnippetShell;
}

function setup(): Setup {
  const shell = new SnippetShell();

  document.body.append(shell.footer);
  return { editor: new SnippetEditor(shell), shell };
}

function isFlagged(element: HTMLElement, name: string): boolean {
  return element.dataset[name] !== undefined;
}

describe("SnippetEditor", () => {
  describe("render", () => {
    test("shows a new snippet", () => {
      const { editor, shell } = setup();

      editor.render(createScene());
      expect(shell.eyebrow.textContent).toBe("New snippet");
      expect(shell.saveButton.textContent).toBe("Save");
      expect(shell.errorMessage.textContent).toBe("");
      expect(isFlagged(shell.cancelButton, "hidden")).toBe(true);
      expect(isFlagged(shell.errorMessage, "hidden")).toBe(true);
      expect(isFlagged(shell.saveButton, "disabled")).toBe(false);
    });

    test("shows the snippet being edited", () => {
      const { editor, shell } = setup();

      editor.render(createScene({ editTarget: "fruits" }));
      expect(shell.eyebrow.textContent).toBe("Editing /fruits");
      expect(shell.saveButton.textContent).toBe("Update");
      expect(isFlagged(shell.cancelButton, "hidden")).toBe(false);
    });

    test.each<[SnippetFailureReason, boolean, boolean]>([
      ["empty-name", true, false],
      ["empty-query", false, true],
      ["duplicate-name", true, false],
      ["not-found", false, false]
    ])("shows a %s failure on the right field", (reason, nameInvalid, queryInvalid) => {
      const { editor, shell } = setup();

      editor.render(createScene({ failure: { reason, message: "failed" } }));
      expect(shell.errorMessage.textContent).toBe("failed");
      expect(isFlagged(shell.errorMessage, "hidden")).toBe(false);
      expect(isFlagged(shell.saveButton, "disabled")).toBe(true);
      expect(isFlagged(shell.nameField, "invalid")).toBe(nameInvalid);
      expect(isFlagged(shell.queryField, "invalid")).toBe(queryInvalid);
    });
  });

  describe("fill", () => {
    test("shows a snippet and focuses its name", () => {
      const { editor, shell } = setup();

      editor.fill(createSnippet("fruits", "apple"));
      expect([shell.nameField.value, shell.queryField.value]).toEqual(["fruits", "apple"]);
      expect(document.activeElement).toBe(shell.nameField);
    });
  });

  describe("clear", () => {
    test("empties both fields", () => {
      const { editor, shell } = setup();

      editor.fill(createSnippet("fruits", "apple"));
      editor.clear();
      expect([shell.nameField.value, shell.queryField.value]).toEqual(["", ""]);
    });
  });

  describe("setQuery", () => {
    test("replaces the query and focuses it", () => {
      const { editor, shell } = setup();

      editor.setQuery("( 1 ~ 2 )");
      expect(shell.queryField.value).toBe("( 1 ~ 2 )");
      expect(document.activeElement).toBe(shell.queryField);
    });
  });
});
