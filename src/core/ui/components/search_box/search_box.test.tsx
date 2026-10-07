import { SearchBox, SearchBoxClass } from "@/core/ui/components/search_box/search_box";
import { afterEach, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import SEARCH_BOX_CSS from "@/core/ui/components/search_box/search_box.css?inline";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  element: HTMLElement;
  input: HTMLInputElement;
  onSearch: (query: string) => void;
}

function setup(): Setup {
  const options = { label: "Search favorites", onSearch: vi.fn() };
  const { result: element } = render(document, () => <SearchBox {...options} />);

  document.body.append(element);
  return { ...options, element, input: element.querySelector("input")! };
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

  test("styles every class it sets", () => {
    expectClassesStyled(SearchBoxClass, SEARCH_BOX_CSS);
  });
});
