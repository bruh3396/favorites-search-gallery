import { Mock, afterEach, describe, expect, test, vi } from "vitest";
import { SearchBox, SearchBoxClass } from "@/core/ui/components/search_box/search_box";
import { h, render } from "@/core/ui/h/h";
import { Emitter } from "@/core/utils/reactive/emitter";
import SEARCH_BOX_CSS from "@/core/ui/components/search_box/search_box.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

interface Setup {
  element: HTMLElement;
  textarea: HTMLTextAreaElement;
  focusRequests: Emitter<void>;
  onSearch: Mock<(query: string) => void>;
  dispose: () => void;
}

function setup(trailingChild?: HTMLElement): Setup {
  const options = {
    label: "Search favorites", query: new Signal(""), trailingChild, focusRequests: new Emitter<void>(), onSearch: vi.fn<(query: string) => void>()
  };
  const { result: element, dispose } = render(document, () => <SearchBox {...options} />);

  document.body.append(element);
  return { ...options, element, dispose, textarea: element.querySelector("textarea")! };
}

function type(textarea: HTMLTextAreaElement, text: string): void {
  textarea.value = text;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function submit(textarea: HTMLTextAreaElement): void {
  textarea.form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

interface ElsewhereSetup {
  element: HTMLElement;
  onSearch: Mock<(query: string) => void>;
  searchElsewhere: Mock<(query: string) => void>;
}

function setupElsewhere(): ElsewhereSetup {
  const onSearch = vi.fn<(query: string) => void>();
  const searchElsewhere = vi.fn<(query: string) => void>();
  const { result: element } = render(document, () => (
    <SearchBox label="Search" query={new Signal("")} onSearch={onSearch} searchElsewhere={searchElsewhere} />
  ));

  document.body.append(element);
  type(element.querySelector("textarea")!, "cat");
  return { element, onSearch, searchElsewhere };
}

function pressSearch(element: HTMLElement, event: MouseEvent): boolean {
  return element.querySelector("button[type=submit]")!.dispatchEvent(event);
}

interface HistorySetup {
  textarea: HTMLTextAreaElement;
  onSearch: Mock<(query: string) => void>;
}

function setupHistory(submittedQueries: readonly string[] = ["dog", "cat"]): HistorySetup {
  const onSearch = vi.fn<(query: string) => void>();
  const { result: element } = render(document, () => (
    <SearchBox label="Search" query={new Signal("")} submittedQueries={new Signal(submittedQueries)} onSearch={onSearch} />
  ));

  document.body.append(element);
  return { textarea: element.querySelector("textarea")!, onSearch };
}

function press(textarea: HTMLTextAreaElement, key: string, modifiers: KeyboardEventInit = {}): boolean {
  return textarea.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...modifiers }));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("SearchBox", () => {
  test("renders a search landmark around a labelled search field", () => {
    const { element, textarea } = setup();

    expect(element.tagName).toBe("SEARCH");
    expect(textarea.getAttribute("aria-label")).toBe("Search favorites");
  });

  test("reports the typed query when submitted, not while typing", () => {
    const { textarea, onSearch } = setup();

    type(textarea, "cat");
    expect(onSearch).not.toHaveBeenCalled();
    submit(textarea);
    expect(onSearch).toHaveBeenCalledExactlyOnceWith("cat");
  });

  test("searches on Enter instead of adding a line break", () => {
    const { textarea, onSearch } = setup();

    type(textarea, "cat");
    expect([press(textarea, "Enter"), onSearch.mock.calls]).toEqual([false, [["cat"]]]);
  });

  test("ignores Shift+Enter, adding no line break and not searching", () => {
    const { textarea, onSearch } = setup();

    type(textarea, "cat");
    expect([press(textarea, "Enter", { shiftKey: true }), onSearch.mock.calls]).toEqual([false, []]);
  });

  test("leaves Enter to the input method while composing", () => {
    const { textarea, onSearch } = setup();

    type(textarea, "cat");
    expect([press(textarea, "Enter", { isComposing: true }), onSearch.mock.calls]).toEqual([true, []]);
  });

  test("turns pasted line breaks into spaces, keeping the caret after them", () => {
    const { textarea } = setup();

    textarea.value = "cat\r\ndog\nfox";
    textarea.setSelectionRange(8, 8);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    expect([textarea.value, textarea.selectionStart]).toEqual(["cat dog fox", 7]);
  });

  test("reports an emptied query only when submitted", () => {
    const { textarea, onSearch } = setup();

    type(textarea, "cat");
    submit(textarea);
    type(textarea, "");
    submit(textarea);
    expect(onSearch).toHaveBeenLastCalledWith("");
  });

  test("reports the typed query when the search button is clicked", () => {
    const { element, textarea, onSearch } = setup();

    type(textarea, "cat");
    element.querySelector<HTMLButtonElement>("button[type=submit]")!.click();
    expect(onSearch).toHaveBeenCalledExactlyOnceWith("cat");
  });

  test("empties the field without searching when cleared", () => {
    const { element, textarea, onSearch } = setup();

    type(textarea, "cat");
    element.querySelector<HTMLButtonElement>("button[aria-label='Clear search']")!.click();
    expect(textarea.value).toBe("");
    expect(onSearch).not.toHaveBeenCalled();
  });

  test("keeps focus in the field when cleared", () => {
    const { element, textarea } = setup();

    type(textarea, "cat");
    element.querySelector<HTMLButtonElement>("button[aria-label='Clear search']")!.click();
    expect(document.activeElement).toBe(textarea);
  });

  test("focuses the field on request until disposed", () => {
    const { textarea, focusRequests, dispose } = setup();

    focusRequests.emit();
    expect(document.activeElement).toBe(textarea);
    textarea.blur();
    dispose();
    focusRequests.emit();
    expect(document.activeElement).not.toBe(textarea);
  });

  test("works without focus requests", () => {
    const onSearch = vi.fn();
    const { result: element } = render(document, () => <SearchBox label="Search" query={new Signal("cat")} onSearch={onSearch} />);

    element.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith("cat");
  });

  test("searches elsewhere, not here, when Search is right-clicked", () => {
    const { element, onSearch, searchElsewhere } = setupElsewhere();
    const isMenuShown = pressSearch(element, new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));

    expect([searchElsewhere.mock.calls, onSearch.mock.calls, isMenuShown]).toEqual([[["cat"]], [], false]);
  });

  test("searches elsewhere, not here, when Search is Ctrl- or Cmd-clicked", () => {
    const { element, onSearch, searchElsewhere } = setupElsewhere();

    pressSearch(element, new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true }));
    pressSearch(element, new MouseEvent("click", { bubbles: true, cancelable: true, metaKey: true }));
    expect([searchElsewhere.mock.calls, onSearch.mock.calls]).toEqual([[["cat"], ["cat"]], []]);
  });

  test("still searches here on a plain click when it can search elsewhere", () => {
    const { element, onSearch, searchElsewhere } = setupElsewhere();

    pressSearch(element, new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect([searchElsewhere.mock.calls, onSearch.mock.calls]).toEqual([[], [["cat"]]]);
  });

  test("leaves the right-click menu alone without a place to search elsewhere", () => {
    const { element } = setup();
    const isMenuShown = pressSearch(element, new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));

    expect(isMenuShown).toBe(true);
  });

  test("recalls older queries on ↑ and newer ones on ↓, back to what was typed", () => {
    const { textarea } = setupHistory();
    const shownTexts: string[] = [];

    type(textarea, "fox");

    for (const key of ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown"]) {
      press(textarea, key);
      shownTexts.push(textarea.value);
    }
    expect(shownTexts).toEqual(["dog", "cat", "dog", "fox"]);
  });

  test("recalls the query before the one still in the box after searching", () => {
    const { textarea } = setupHistory(["cherry", "banana"]);

    type(textarea, "cherry");
    submit(textarea);
    press(textarea, "ArrowUp");
    expect(textarea.value).toBe("banana");
  });

  test("puts the caret at the end of a recalled query", () => {
    const { textarea } = setupHistory();

    press(textarea, "ArrowUp");
    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([3, 3]);
  });

  test("recalls without searching", () => {
    const { textarea, onSearch } = setupHistory();

    press(textarea, "ArrowUp");
    expect(onSearch).not.toHaveBeenCalled();
  });

  test("leaves ↑ to the field when nothing is left to recall", () => {
    const { textarea } = setupHistory([]);

    type(textarea, "fox");
    expect([press(textarea, "ArrowUp"), textarea.value]).toEqual([true, "fox"]);
  });

  test.each([{ shiftKey: true }, { altKey: true }, { ctrlKey: true }, { metaKey: true }, { isComposing: true }])("ignores ↑ with %o", modifiers => {
    const { textarea } = setupHistory();

    type(textarea, "fox");
    press(textarea, "ArrowUp", modifiers);
    expect(textarea.value).toBe("fox");
  });

  test("ignores ↑ another handler already took", () => {
    const { textarea } = setupHistory();

    textarea.parentElement!.addEventListener("keydown", event => event.preventDefault(), { capture: true });
    type(textarea, "fox");
    press(textarea, "ArrowUp");
    expect(textarea.value).toBe("fox");
  });

  test("recalls from the newest query again after typing", () => {
    const { textarea } = setupHistory();

    press(textarea, "ArrowUp");
    press(textarea, "ArrowUp");
    type(textarea, "owl");
    press(textarea, "ArrowUp");
    expect(textarea.value).toBe("dog");
  });

  test("leaves other keys to the field", () => {
    const { textarea } = setupHistory();

    type(textarea, "fox");
    expect([press(textarea, "ArrowLeft"), textarea.value]).toEqual([true, "fox"]);
  });

  test("recalls on ↑ and ↓ only from the very start and end once the query wraps", () => {
    const { textarea } = setupHistory();
    const recalledTexts: string[] = [];

    Object.defineProperty(textarea, "scrollHeight", { value: 60 });
    textarea.style.lineHeight = "20px";
    type(textarea, "fox");

    for (const [key, caret] of [["ArrowUp", 1], ["ArrowUp", 0], ["ArrowDown", 1], ["ArrowDown", 3]] as const) {
      textarea.setSelectionRange(caret, caret);
      press(textarea, key);
      recalledTexts.push(textarea.value);
    }
    expect(recalledTexts).toEqual(["fox", "dog", "dog", "fox"]);
  });

  test("recalls from the newest query again after clearing", () => {
    const { textarea } = setupHistory();

    press(textarea, "ArrowUp");
    press(textarea, "ArrowUp");
    textarea.form!.querySelector<HTMLButtonElement>("button[aria-label='Clear search']")!.click();
    press(textarea, "ArrowUp");
    expect(textarea.value).toBe("dog");
  });

  test("recalls from the newest query again after searching", () => {
    const { textarea } = setupHistory();

    press(textarea, "ArrowUp");
    press(textarea, "ArrowUp");
    submit(textarea);
    press(textarea, "ArrowUp");
    expect(textarea.value).toBe("dog");
  });

  test("grows to the wrapped lines of its query, up to 8", () => {
    const { textarea } = setup();
    const readLineCount = (): string => textarea.form!.style.getPropertyValue("--fsg-SearchBox-line-count");
    const lineCounts: string[] = [];

    textarea.style.lineHeight = "20px";

    for (const scrollHeight of [20, 60, 400]) {
      Object.defineProperty(textarea, "scrollHeight", { value: scrollHeight, configurable: true });
      type(textarea, "cat");
      lineCounts.push(readLineCount());
    }
    expect(lineCounts).toEqual(["1", "3", "8"]);
  });

  test("shows trailing content inside the field", () => {
    const trailingChild = document.createElement("span");
    const { textarea } = setup(trailingChild);

    expect(textarea.form!.contains(trailingChild)).toBe(true);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SearchBoxClass, SEARCH_BOX_CSS);
  });
});
