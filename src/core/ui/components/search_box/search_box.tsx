import { Child, h } from "@/core/ui/h/h";
import { Readable } from "@/core/utils/reactive/signal";

export const SearchBoxClass = {
  root: "fsg-SearchBox",
  field: "fsg-SearchBox-field",
  input: "fsg-SearchBox-input"
} as const;

export interface SearchBoxProps {
  label: string;
  query: Readable<string>;
  trailing?: Child;
  onSearch: (query: string) => void;
}

export function SearchBox({ label, query, trailing, onSearch }: SearchBoxProps): HTMLElement {
  const input = <input className={SearchBoxClass.input} type="search" placeholder={label} aria-label={label} value={query} /> as HTMLInputElement;
  return (
    <search className={SearchBoxClass.root}>
      <form
        className={SearchBoxClass.field}
        onSubmit={event => {
          event.preventDefault();
          onSearch(input.value);
        }}
      >
        {input}
        {trailing}
      </form>
    </search>
  );
}
