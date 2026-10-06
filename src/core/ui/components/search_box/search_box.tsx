import { Readable, effect } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const SearchBoxClass = {
  root: "fsg-SearchBox",
  input: "fsg-SearchBox-input"
} as const;

export interface SearchBoxOptions {
  label: string;
  query: Readable<string>;
  onSearch: (query: string) => void;
}

export function SearchBox({ label, query, onSearch }: SearchBoxOptions): HTMLElement {
  const input = <input className={SearchBoxClass.input} type="search" placeholder={label} aria-label={label} /> as HTMLInputElement;

  effect(() => showQuery(input, query.value));
  return (
    <search className={SearchBoxClass.root}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(input.value);
        }}
      >
        {input}
      </form>
    </search>
  );
}

function showQuery(input: HTMLInputElement, query: string): void {
  if ((input.getRootNode() as Document | ShadowRoot).activeElement !== input) {
    input.value = query;
  }
}
