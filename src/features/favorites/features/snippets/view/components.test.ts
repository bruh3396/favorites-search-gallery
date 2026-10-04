import * as SnippetComponents from "@/features/favorites/features/snippets/view/components";
import { createScene, createSnippet } from "@/features/favorites/features/snippets/testing/snippets";
import { describe, expect, test } from "vitest";

const fruits = createSnippet("fruits", "( apple ~ banana )");
const colors = createSnippet("colors", "( red ~ blue )");

function queryButtons(element: HTMLElement): HTMLButtonElement[] {
  return Array.from(element.querySelectorAll("button"));
}

describe("list", () => {
  test("shows the placeholder when there are no rows", () => {
    expect(SnippetComponents.list(createScene({ placeholder: "No snippets yet" })).map(element => element.textContent)).toEqual(["No snippets yet"]);
  });

  test("asks to confirm only the snippet being deleted", () => {
    const rows = SnippetComponents.list(createScene({ rows: [fruits, colors], deleteTarget: "colors" }));

    expect(rows.map(element => element.dataset.snippetAction)).toEqual(["use", undefined]);
  });
});

describe("row", () => {
  test("shows the slash name and the query", () => {
    const { textContent } = SnippetComponents.row(fruits);

    expect(textContent).toContain("/fruits");
    expect(textContent).toContain("( apple ~ banana )");
  });

  test("shows the query as its tooltip", () => {
    expect(SnippetComponents.row(fruits).dataset.tooltip).toBe("( apple ~ banana )");
  });

  test("is tagged to use the named snippet", () => {
    const row = SnippetComponents.row(fruits);

    expect([row.dataset.snippetAction, row.dataset.snippetName]).toEqual(["use", "fruits"]);
  });

  test("tags its buttons with their actions", () => {
    expect(queryButtons(SnippetComponents.row(fruits)).map(button => button.dataset.snippetAction)).toEqual(["moveToTop", "edit", "requestDelete"]);
  });

  test("marks only the delete action as dangerous", () => {
    expect(queryButtons(SnippetComponents.row(fruits)).map(button => button.dataset.danger !== undefined)).toEqual([false, false, true]);
  });
});

describe("confirmRow", () => {
  test("asks to confirm the deletion", () => {
    const { textContent } = SnippetComponents.confirmRow(fruits);

    expect(textContent).toContain("/fruits");
    expect(textContent).toContain("Delete this snippet?");
  });

  test("offers cancel and a dangerous delete", () => {
    const buttons = queryButtons(SnippetComponents.confirmRow(fruits));

    expect(buttons.map(button => button.dataset.snippetAction)).toEqual(["cancelDelete", "delete"]);
    expect(buttons.map(button => button.dataset.danger !== undefined)).toEqual([false, true]);
  });

  test("names the snippet without an action of its own", () => {
    const row = SnippetComponents.confirmRow(fruits);

    expect([row.dataset.snippetAction, row.dataset.snippetName]).toEqual([undefined, "fruits"]);
  });
});

describe("placeholder", () => {
  test("shows the given text", () => {
    expect(SnippetComponents.placeholder("No snippets yet").textContent).toBe("No snippets yet");
  });
});
