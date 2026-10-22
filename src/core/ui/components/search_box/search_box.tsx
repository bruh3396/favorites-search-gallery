import { Child, h } from "@/core/ui/h/h";
import { Readable } from "@/core/utils/reactive/signal";
import { createIcon } from "@/core/ui/components/icon/icon";

export const SearchBoxClass = {
  root: "fsg-SearchBox",
  field: "fsg-SearchBox-field",
  submit: "fsg-SearchBox-submit",
  icon: "fsg-SearchBox-icon",
  input: "fsg-SearchBox-input",
  clear: "fsg-SearchBox-clear"
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
        <button className={SearchBoxClass.submit} type="submit" aria-label="Search">
          {createIcon("search", SearchBoxClass.icon)}
        </button>
        {input}
        <button
          className={SearchBoxClass.clear}
          type="button"
          aria-label="Clear search"
          onClick={() => {
            input.value = "";
            input.focus();
          }}
        >
          {createIcon("close", SearchBoxClass.icon)}
        </button>
        {trailing}
      </form>
    </search>
  );
}
