import { Mock, afterEach, describe, expect, test, vi } from "vitest";
import { SearchBox, SearchBoxClass } from "@/core/ui/components/search_box/search_box";
import { h, render } from "@/core/ui/h/h";
import { Emitter } from "@/core/utils/reactive/emitter";
import SEARCH_BOX_CSS from "@/core/ui/components/search_box/search_box.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

interface Setup {
  element: HTMLElement;
  input: HTMLInputElement;
  focusRequests: Emitter<void>;
  onSearch: (query: string) => void;
  dispose: () => void;
}

function setup(trailingChild?: HTMLElement): Setup {
  const options = { label: "Search favorites", query: new Signal(""), trailingChild, focusRequests: new Emitter<void>(), onSearch: vi.fn() };
  const { result: element, dispose } = render(document, () => <SearchBox {...options} />);

  document.body.append(element);
  return { ...options, element, dispose, input: element.querySelector("input")! };
}

function type(input: HTMLInputElement, text: string): void {
  input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function submit(input: HTMLInputElement): void {
  input.form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
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
  type(element.querySelector("input")!, "cat");
  return { element, onSearch, searchElsewhere };
}

function pressSearch(element: HTMLElement, event: MouseEvent): boolean {
  return element.querySelector("button[type=submit]")!.dispatchEvent(event);
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("SearchBox", () => {
  test("renders a search landmark around a labelled search field", () => {
    const { element, input } = setup();

    expect(element.tagName).toBe("SEARCH");
    expect(input.type).toBe("search");
    expect(input.getAttribute("aria-label")).toBe("Search favorites");
  });

  test("reports the typed query when submitted, not while typing", () => {
    const { input, onSearch } = setup();

    type(input, "cat");
    expect(onSearch).not.toHaveBeenCalled();
    submit(input);
    expect(onSearch).toHaveBeenCalledExactlyOnceWith("cat");
  });

  test("reports an emptied query only when submitted", () => {
    const { input, onSearch } = setup();

    type(input, "cat");
    submit(input);
    type(input, "");
    submit(input);
    expect(onSearch).toHaveBeenLastCalledWith("");
  });

  test("reports the typed query when the search button is clicked", () => {
    const { element, input, onSearch } = setup();

    type(input, "cat");
    element.querySelector<HTMLButtonElement>("button[type=submit]")!.click();
    expect(onSearch).toHaveBeenCalledExactlyOnceWith("cat");
  });

  test("empties the field without searching when cleared", () => {
    const { element, input, onSearch } = setup();

    type(input, "cat");
    element.querySelector<HTMLButtonElement>("button[aria-label='Clear search']")!.click();
    expect(input.value).toBe("");
    expect(onSearch).not.toHaveBeenCalled();
  });

  test("keeps focus in the field when cleared", () => {
    const { element, input } = setup();

    type(input, "cat");
    element.querySelector<HTMLButtonElement>("button[aria-label='Clear search']")!.click();
    expect(document.activeElement).toBe(input);
  });

  test("focuses the field on request until disposed", () => {
    const { input, focusRequests, dispose } = setup();

    focusRequests.emit();
    expect(document.activeElement).toBe(input);
    input.blur();
    dispose();
    focusRequests.emit();
    expect(document.activeElement).not.toBe(input);
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

  test("shows trailing content inside the field", () => {
    const trailingChild = document.createElement("span");
    const { input } = setup(trailingChild);

    expect(input.form!.contains(trailingChild)).toBe(true);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SearchBoxClass, SEARCH_BOX_CSS);
  });
});
