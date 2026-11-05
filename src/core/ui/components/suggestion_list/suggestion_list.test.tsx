import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { SuggestionList, SuggestionListClass } from "@/core/ui/components/suggestion_list/suggestion_list";
import { h, render } from "@/core/ui/h/h";
import SUGGESTION_LIST_CSS from "@/core/ui/components/suggestion_list/suggestion_list.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { Suggestion } from "@/core/ui/components/suggestion_list/suggestion";
import { expectClassesStyled } from "@/testing/css_utilities";

const SUGGESTIONS: readonly Suggestion[] = [
  { text: "cat_ears", icon: "search", detail: "812" },
  { text: "cats", detail: "41" },
  { text: "score:" }
];

interface Setup {
  list: HTMLElement;
  suggestions: Signal<readonly Suggestion[]>;
  highlightedIndex: Signal<number | null>;
  onAccept: Mock<(suggestion: Suggestion) => void>;
  dispose: () => void;
}

function setup(initialSuggestions: readonly Suggestion[] = SUGGESTIONS): Setup {
  const suggestions = new Signal(initialSuggestions);
  const highlightedIndex = new Signal<number | null>(null);
  const onAccept = vi.fn<(suggestion: Suggestion) => void>();
  const { result: list, dispose } = render(document, () => (
    <SuggestionList suggestions={suggestions} highlightedIndex={highlightedIndex} onAccept={onAccept} />
  ));

  onTestFinished(dispose);
  return { list, suggestions, highlightedIndex, onAccept, dispose };
}

function queryOptions(list: HTMLElement): HTMLElement[] {
  return [...list.querySelectorAll<HTMLElement>("[role=option]")];
}

function listHighlightedTexts(list: HTMLElement): (string | null)[] {
  return queryOptions(list).filter(option => option.getAttribute("aria-selected") === "true").map(option => option.textContent);
}

describe("SuggestionList", () => {
  test("shows a row for each suggestion", () => {
    const { list } = setup();

    expect(list.role).toBe("listbox");
    expect(queryOptions(list).map(option => option.textContent)).toEqual(["cat_ears812", "cats41", "score:"]);
  });

  test("shows an icon only on a row that has one", () => {
    const { list } = setup();

    expect(queryOptions(list).map(option => option.querySelector("svg") !== null)).toEqual([true, false, false]);
  });

  test("marks the matched start of a row's text", () => {
    const { list } = setup([{ text: "score:", matchedLength: 2 }]);

    expect([list.querySelector("b")!.textContent, queryOptions(list)[0].textContent]).toEqual(["sc", "score:"]);
  });

  test("follows its suggestions", () => {
    const { list, suggestions } = setup();

    suggestions.value = [{ text: "dog" }, { text: "cats", detail: "41" }];
    expect(queryOptions(list).map(option => option.textContent)).toEqual(["dog", "cats41"]);
  });

  test("shows new details for a row that keeps its text", () => {
    const { list, suggestions } = setup([{ text: "cats", detail: "41" }]);

    suggestions.value = [{ text: "cats", detail: "42" }];
    expect(queryOptions(list).map(option => option.textContent)).toEqual(["cats42"]);
  });

  test("keeps suggestions that differ only by icon apart", () => {
    const { list } = setup([{ text: "cat", icon: "search" }, { text: "cat", icon: "filter" }]);

    expect(queryOptions(list)).toHaveLength(2);
  });

  test("highlights nothing without a highlighted index", () => {
    expect(listHighlightedTexts(setup().list)).toEqual([]);
  });

  test("follows the highlighted index", () => {
    const { list, highlightedIndex } = setup();

    highlightedIndex.value = 1;
    expect(listHighlightedTexts(list)).toEqual(["cats41"]);
    highlightedIndex.value = 2;
    expect(listHighlightedTexts(list)).toEqual(["score:"]);
    highlightedIndex.value = null;
    expect(listHighlightedTexts(list)).toEqual([]);
  });

  test("moves the highlight to whichever row takes the index", () => {
    const { list, suggestions, highlightedIndex } = setup();

    highlightedIndex.value = 0;
    suggestions.value = [{ text: "dog" }, SUGGESTIONS[0]];
    expect(listHighlightedTexts(list)).toEqual(["dog"]);
  });

  test("ignores a highlighted index past the last row", () => {
    const { list, highlightedIndex } = setup();

    highlightedIndex.value = 9;
    expect(listHighlightedTexts(list)).toEqual([]);
  });

  test("scrolls the highlighted row into view", () => {
    const { list, highlightedIndex } = setup();
    const scrollIntoView = vi.fn();

    queryOptions(list)[2].scrollIntoView = scrollIntoView;
    highlightedIndex.value = 2;
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  test("reports the clicked row", () => {
    const { list, onAccept } = setup();

    queryOptions(list)[1].click();
    expect(onAccept).toHaveBeenCalledExactlyOnceWith(SUGGESTIONS[1]);
  });

  test("reports the highlighted row's element", () => {
    const onActiveDescendantChange = vi.fn<(activeDescendantElement: HTMLElement | null) => void>();
    const highlightedIndex = new Signal<number | null>(null);
    const { result: list } = render(document, () => (
      <SuggestionList
        suggestions={new Signal(SUGGESTIONS)}
        highlightedIndex={highlightedIndex}
        onAccept={vi.fn()}
        onActiveDescendantChange={onActiveDescendantChange}
      />
    ));

    highlightedIndex.value = 1;
    highlightedIndex.value = 9;
    expect(onActiveDescendantChange.mock.calls).toEqual([[null], [queryOptions(list)[1]], [null]]);
  });

  test("keeps focus where it is when pressed", () => {
    const press = new MouseEvent("mousedown", { bubbles: true, cancelable: true });

    queryOptions(setup().list)[0].dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
  });

  test("stops following its suggestions once disposed", () => {
    const { list, suggestions, dispose } = setup();

    dispose();
    suggestions.value = [];
    expect(queryOptions(list)).toHaveLength(3);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SuggestionListClass, SUGGESTION_LIST_CSS);
  });
});
