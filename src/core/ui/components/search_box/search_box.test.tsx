import { SearchBox, SearchBoxClass } from "@/core/ui/components/search_box/search_box";
import { afterEach, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Emitter } from "@/core/utils/reactive/emitter";
import SEARCH_BOX_CSS from "@/core/ui/components/search_box/search_box.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

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

afterEach(() => {
  document.body.replaceChildren();
});

describe("SearchBox", () => {
  test("is a search landmark around a labelled search field", () => {
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

  test("shows trailing content inside the field", () => {
    const trailingChild = document.createElement("span");
    const { input } = setup(trailingChild);

    expect(input.form!.contains(trailingChild)).toBe(true);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SearchBoxClass, SEARCH_BOX_CSS);
  });
});
