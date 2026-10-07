import { h } from "@/core/ui/h/h";

export const SearchBoxClass = {
  root: "fsg-SearchBox",
  input: "fsg-SearchBox-input"
} as const;

export interface SearchBoxProps {
  label: string;
  onSearch: (query: string) => void;
}

export function SearchBox({ label, onSearch }: SearchBoxProps): HTMLElement {
  const input = <input className={SearchBoxClass.input} type="search" placeholder={label} aria-label={label} /> as HTMLInputElement;
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
