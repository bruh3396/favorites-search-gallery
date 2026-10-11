import { Readable } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const SearchBoxClass = {
  root: "fsg-SearchBox",
  input: "fsg-SearchBox-input"
} as const;

export interface SearchBoxProps {
  label: string;
  query: Readable<string>;
  onSearch: (query: string) => void;
}

export function SearchBox({ label, query, onSearch }: SearchBoxProps): HTMLElement {
  const input = <input className={SearchBoxClass.input} type="search" placeholder={label} aria-label={label} value={query} /> as HTMLInputElement;
  return (
    <search className={SearchBoxClass.root}>
      <form
        onSubmit={event => {
          event.preventDefault();
          onSearch(input.value);
        }}
      >
        {input}
      </form>
    </search>
  );
}
