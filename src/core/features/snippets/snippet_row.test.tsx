import { SnippetRow, SnippetRowClass } from "@/core/features/snippets/snippet_row";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import SNIPPET_ROW_CSS from "@/core/features/snippets/snippet_row.css?inline";
import { createSnippet } from "@/testing/snippet";
import { expectClassesStyled } from "@/testing/css_utilities";

function readNameButton(snippetRow: HTMLElement): HTMLButtonElement {
  return snippetRow.querySelector<HTMLButtonElement>(`.${SnippetRowClass.name}`)!;
}

describe("SnippetRow", () => {
  test("shows its snippet's name, with the query on hover", () => {
    const { result: snippetRow } = render(document, () => (
      <SnippetRow snippet={createSnippet({ name: "no ai", query: "-ai_generated" })} open={vi.fn()} edit={vi.fn()} />
    ));

    expect([readNameButton(snippetRow).textContent, readNameButton(snippetRow).title]).toEqual(["no ai", "-ai_generated"]);
  });

  test("asks to open its snippet when its name is clicked", () => {
    const open = vi.fn();
    const { result: snippetRow } = render(document, () => <SnippetRow snippet={createSnippet({ name: "no ai" })} open={open} edit={vi.fn()} />);

    readNameButton(snippetRow).click();
    expect(open).toHaveBeenCalledOnce();
  });

  test("asks to edit when its pencil is clicked", () => {
    const edit = vi.fn();
    const { result: snippetRow } = render(document, () => <SnippetRow snippet={createSnippet({ name: "no ai" })} open={vi.fn()} edit={edit} />);

    snippetRow.querySelector<HTMLButtonElement>("button[aria-label=\"Edit no ai\"]")!.click();
    expect(edit).toHaveBeenCalledOnce();
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SnippetRowClass, SNIPPET_ROW_CSS);
  });
});
