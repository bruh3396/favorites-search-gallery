import { createScene, createSnippet } from "@/features/favorites/features/snippets/testing/snippets";
import { describe, expect, test } from "vitest";
import { SnippetShell } from "@/features/favorites/features/snippets/shell/shell";
import { SnippetView } from "@/features/favorites/features/snippets/view/view";

interface Setup {
  view: SnippetView;
  shell: SnippetShell;
}

const fruits = createSnippet("fruits", "apple");
const veg = createSnippet("veg", "carrot");

function setup(): Setup {
  const shell = new SnippetShell();
  return { view: new SnippetView(shell), shell };
}

function readNames(shell: SnippetShell): string[] {
  return [...shell.list.querySelectorAll<HTMLElement>("[data-snippet-name]")].map(row => row.dataset.snippetName ?? "");
}

describe("SnippetView", () => {
  describe("mount", () => {
    test("appends the filter, the list, and the editor", () => {
      const { view, shell } = setup();
      const container = document.createElement("div");

      view.mount(container);
      expect([...container.children]).toEqual([shell.filter, shell.list, shell.footer]);
    });
  });

  describe("render", () => {
    test("lists the rows in the given order", () => {
      const { view, shell } = setup();

      view.render(createScene({ rows: [veg, fruits] }));
      expect(readNames(shell)).toEqual(["veg", "fruits"]);
    });

    test("asks to confirm only the snippet pending deletion", () => {
      const { view, shell } = setup();

      view.render(createScene({ rows: [fruits, veg], deleteTarget: "veg" }));
      const rows = [...shell.list.querySelectorAll<HTMLElement>("[data-snippet-name]")];

      expect(rows.map(row => row.textContent?.includes("Delete this snippet?"))).toEqual([false, true]);
    });

    test("shows the placeholder when there are no rows", () => {
      const { view, shell } = setup();

      view.render(createScene({ placeholder: "No matching snippets" }));
      expect(shell.list.textContent).toBe("No matching snippets");
    });

    test("renders the editor too", () => {
      const { view, shell } = setup();

      view.render(createScene({ editTarget: "veg" }));
      expect(shell.eyebrow.textContent).toBe("Editing /veg");
    });
  });

  test("reaches the editor's fields through fill, setQuery, and clear", () => {
    const { view, shell } = setup();

    view.fill(fruits);
    expect([shell.nameField.value, shell.queryField.value]).toEqual(["fruits", "apple"]);
    view.setQuery("( 1 ~ 2 )");
    expect(shell.queryField.value).toBe("( 1 ~ 2 )");
    view.clear();
    expect([shell.nameField.value, shell.queryField.value]).toEqual(["", ""]);
  });
});
