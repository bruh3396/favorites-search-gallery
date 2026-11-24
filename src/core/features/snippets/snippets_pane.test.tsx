import { SnippetsPane, SnippetsPaneClass, SnippetsPaneProps } from "@/core/features/snippets/snippets_pane";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { EmptyStateClass } from "@/core/ui/components/empty_state/empty_state";
import SNIPPETS_PANE_CSS from "@/core/features/snippets/snippets_pane.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { Snippet } from "@/core/domain/snippet/snippet";
import { SnippetRowClass } from "@/core/features/snippets/snippet_row";
import { createSnippet } from "@/testing/snippet";
import { expectClassesStyled } from "@/testing/css_utilities";

function setup(snippets: Signal<readonly Snippet[]>, partialSnippetsPaneProps: Partial<SnippetsPaneProps> = {}): HTMLElement {
  return render(document, () => (
    <SnippetsPane
      snippets={snippets}
      isNameTaken={name => snippets.value.some(snippet => snippet.name === name)}
      save={vi.fn()}
      remove={vi.fn()}
      open={vi.fn()}
      {...partialSnippetsPaneProps}
    />
  )).result;
}

function createSnippets(): Signal<readonly Snippet[]> {
  return new Signal<readonly Snippet[]>([
    createSnippet({ name: "fruits", query: "apple" }),
    createSnippet({ name: "landscape hq", query: "landscape highres" }),
    createSnippet({ name: "no ai", query: "-ai_generated" })
  ]);
}

function readShownNames(snippetsPane: HTMLElement): string[] {
  return [...snippetsPane.querySelectorAll<HTMLElement>(`.${SnippetRowClass.name}`)]
    .filter(name => name.closest("[hidden]") === null)
    .map(name => name.textContent);
}

function readShownEmptyStateMessages(snippetsPane: HTMLElement): string[] {
  return [...snippetsPane.querySelectorAll<HTMLElement>(`.${EmptyStateClass.message}`)]
    .filter(message => message.closest("[hidden]") === null)
    .map(message => message.textContent);
}

function readShownFormNames(snippetsPane: HTMLElement): string[] {
  return [...snippetsPane.querySelectorAll("label")]
    .filter(textField => textField.firstChild?.textContent === "Name" && textField.closest("[hidden]") === null)
    .map(textField => textField.querySelector("input")!.value);
}

function searchSnippets(snippetsPane: HTMLElement, searchText: string): void {
  const input = snippetsPane.querySelector<HTMLInputElement>("input[aria-label=\"Search Snippets\"]")!;

  input.value = searchText;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function clickButton(snippetsPane: HTMLElement, label: string): void {
  [...snippetsPane.querySelectorAll("button")].find(button => button.getAttribute("aria-label") === label || button.textContent === label)!.click();
}

function typeName(snippetsPane: HTMLElement, name: string): void {
  const input = [...snippetsPane.querySelectorAll("label")].find(textField => textField.firstChild?.textContent === "Name")!.querySelector("input")!;

  input.value = name;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("SnippetsPane", () => {
  test("lists its snippets' names", () => {
    expect(readShownNames(setup(createSnippets()))).toEqual(["fruits", "landscape hq", "no ai"]);
  });

  test("follows its snippets", () => {
    const snippets = createSnippets();
    const snippetsPane = setup(snippets);

    snippets.value = [createSnippet({ name: "pets" })];
    expect(readShownNames(snippetsPane)).toEqual(["pets"]);
  });

  test("says when there are no snippets yet", () => {
    const snippetsPane = setup(new Signal<readonly Snippet[]>([]));

    expect(readShownEmptyStateMessages(snippetsPane)).toEqual(["No snippets yet"]);
  });

  test("matches names holding every searched word, ignoring queries and case", () => {
    const snippetsPane = setup(createSnippets());

    searchSnippets(snippetsPane, "HQ land");
    const landscapeNames = readShownNames(snippetsPane);

    searchSnippets(snippetsPane, "apple");
    expect([landscapeNames, readShownNames(snippetsPane)]).toEqual([["landscape hq"], []]);
  });

  test("names the search text when nothing matches", () => {
    const snippetsPane = setup(createSnippets());
    const initialEmptyStateMessages = readShownEmptyStateMessages(snippetsPane);

    searchSnippets(snippetsPane, " nothing ");
    expect([initialEmptyStateMessages, readShownEmptyStateMessages(snippetsPane)]).toEqual([[], ["No snippets match \"nothing\""]]);
  });

  test("opens a snippet when its name is clicked", () => {
    const open = vi.fn();
    const snippets = createSnippets();

    clickButton(setup(snippets, { open }), "no ai");
    expect(open).toHaveBeenCalledWith(snippets.value[2]);
  });

  test("opens a blank form for a new snippet, in place of the empty message", () => {
    const snippetsPane = setup(new Signal<readonly Snippet[]>([]));

    clickButton(snippetsPane, "New Snippet");
    expect([readShownFormNames(snippetsPane), readShownEmptyStateMessages(snippetsPane)]).toEqual([[""], []]);
  });

  test("saves a new snippet and closes its form", () => {
    const save = vi.fn();
    const snippetsPane = setup(createSnippets(), { save });

    clickButton(snippetsPane, "New Snippet");
    typeName(snippetsPane, "pets");
    clickButton(snippetsPane, "Save");
    expect([save.mock.calls, readShownFormNames(snippetsPane)]).toEqual([[[{ name: "pets", query: "" }]], []]);
  });

  test("opens a snippet's form in place of its row", () => {
    const snippetsPane = setup(createSnippets());

    clickButton(snippetsPane, "Edit fruits");
    expect([readShownFormNames(snippetsPane), readShownNames(snippetsPane)]).toEqual([["fruits"], ["landscape hq", "no ai"]]);
  });

  test("keeps one form open at a time", () => {
    const snippetsPane = setup(createSnippets());

    clickButton(snippetsPane, "New Snippet");
    clickButton(snippetsPane, "Edit fruits");
    const editingFormNames = readShownFormNames(snippetsPane);

    clickButton(snippetsPane, "New Snippet");
    expect([editingFormNames, readShownFormNames(snippetsPane)]).toEqual([["fruits"], [""]]);
  });

  test("saves an edited snippet under its previous name and closes its form", () => {
    const save = vi.fn();
    const snippetsPane = setup(createSnippets(), { save });

    clickButton(snippetsPane, "Edit fruits");
    typeName(snippetsPane, "produce");
    clickButton(snippetsPane, "Save");
    expect([save.mock.calls, readShownFormNames(snippetsPane)]).toEqual([[[{ name: "produce", query: "apple" }, "fruits"]], []]);
  });

  test("checks an edited name against every other snippet", () => {
    const isNameTaken = vi.fn(() => false);
    const snippetsPane = setup(createSnippets(), { isNameTaken });

    clickButton(snippetsPane, "Edit fruits");
    typeName(snippetsPane, "no ai");
    expect(isNameTaken).toHaveBeenLastCalledWith("no ai", "fruits");
  });

  test("removes an edited snippet and closes its form", () => {
    const remove = vi.fn();
    const snippetsPane = setup(createSnippets(), { remove });

    clickButton(snippetsPane, "Edit fruits");
    clickButton(snippetsPane, "Delete");
    expect([remove.mock.calls, readShownFormNames(snippetsPane)]).toEqual([[["fruits"]], []]);
  });

  test("closes a form on Cancel", () => {
    const snippetsPane = setup(createSnippets());

    clickButton(snippetsPane, "Edit fruits");
    clickButton(snippetsPane, "Cancel");
    expect([readShownFormNames(snippetsPane), readShownNames(snippetsPane)]).toEqual([[], ["fruits", "landscape hq", "no ai"]]);
  });

  test("keeps the edited snippet's form open while a search hides its row", () => {
    const snippetsPane = setup(createSnippets());

    clickButton(snippetsPane, "Edit fruits");
    searchSnippets(snippetsPane, "no");
    expect([readShownFormNames(snippetsPane), readShownNames(snippetsPane)]).toEqual([["fruits"], ["no ai"]]);
  });

  test("stops following its snippets once disposed", () => {
    const snippets = createSnippets();
    const { result: snippetsPane, dispose } = render(document, () => (
      <SnippetsPane snippets={snippets} isNameTaken={() => false} save={vi.fn()} remove={vi.fn()} open={vi.fn()} />
    ));

    clickButton(snippetsPane, "New Snippet");
    dispose();
    snippets.value = [];
    expect(readShownNames(snippetsPane)).toEqual(["fruits", "landscape hq", "no ai"]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SnippetsPaneClass, SNIPPETS_PANE_CSS);
  });
});
