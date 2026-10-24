import { Child, h } from "@/core/ui/h/h";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { Readable } from "@/core/utils/reactive/signal";
import { createIcon } from "@/core/ui/components/icon/icon";
import { onCleanup } from "@/core/utils/reactive/scope";

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
  focusRequests?: Occurrence<void>;
  onSearch: (query: string) => void;
}

export function SearchBox({ label, query, trailing, focusRequests, onSearch }: SearchBoxProps): HTMLElement {
  const input = <input className={SearchBoxClass.input} type="search" spellcheck={false} placeholder={label} aria-label={label} value={query} /> as HTMLInputElement;

  if (focusRequests !== undefined) {
    onCleanup(focusRequests.on(() => input.focus()));
  }
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
