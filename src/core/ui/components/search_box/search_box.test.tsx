import { SearchBox, SearchBoxClass } from "@/core/ui/components/search_box/search_box";
import { afterEach, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import SEARCH_BOX_CSS from "@/core/ui/components/search_box/search_box.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  element: HTMLElement;
  input: HTMLInputElement;
  query: Signal<string>;
  onSearch: (query: string) => void;
  dispose: () => void;
}

function setup(initialQuery = ""): Setup {
  const options = { label: "Search favorites", query: new Signal(initialQuery), onSearch: vi.fn() };
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
    const { input, onSearch } = setup("cat");

    type(input, "");
    expect(onSearch).not.toHaveBeenCalled();
    submit(input);
    expect(onSearch).toHaveBeenCalledExactlyOnceWith("");
  });

  test("shows the query", () => {
    const { input, query } = setup("cat");

    expect(input.value).toBe("cat");
    query.value = "dog";
    expect(input.value).toBe("dog");
  });

  test("keeps what is being typed when the query changes", () => {
    const { input, query } = setup();

    input.focus();
    type(input, "ca");
    query.value = "dog";
    expect(input.value).toBe("ca");
  });

  test("stops following the query once disposed", () => {
    const { input, query, dispose } = setup("cat");

    dispose();
    query.value = "dog";
    expect(input.value).toBe("cat");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SearchBoxClass, SEARCH_BOX_CSS);
  });
});
