import { Readable, effect } from "@/core/utils/reactive/signal";

export const SearchBoxClass = {
  root: "fsg-SearchBox",
  input: "fsg-SearchBox-input"
} as const;

export interface SearchBoxOptions {
  label: string;
  query: Readable<string>;
  onSearch: (query: string) => void;
}

export interface SearchBox {
  readonly element: HTMLElement;
  dispose: () => void;
}

export function createSearchBox(ownerDocument: Document, { label, query, onSearch }: SearchBoxOptions): SearchBox {
  const element = ownerDocument.createElement("search");
  const form = ownerDocument.createElement("form");
  const input = ownerDocument.createElement("input");

  element.className = SearchBoxClass.root;
  input.className = SearchBoxClass.input;
  input.type = "search";
  input.placeholder = label;
  input.setAttribute("aria-label", label);
  form.append(input);
  element.append(form);
  form.addEventListener("submit", event => {
    event.preventDefault();
    onSearch(input.value);
  });

  const dispose = effect(() => showQuery(input, query.value));
  return { element, dispose };
}

function showQuery(input: HTMLInputElement, query: string): void {
  if ((input.getRootNode() as Document | ShadowRoot).activeElement !== input) {
    input.value = query;
  }
}
