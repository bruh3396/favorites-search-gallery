import { Child, h } from "@/core/ui/h/h";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { Readable } from "@/core/utils/reactive/signal";
import { onCleanup } from "@/core/utils/reactive/scope";

export const SearchBoxClass = {
  root: "fsg-SearchBox",
  field: "fsg-SearchBox-field",
  submit: "fsg-SearchBox-submit",
  input: "fsg-SearchBox-input",
  clear: "fsg-SearchBox-clear"
} as const;

export interface SearchBoxProps {
  label: string;
  query: Readable<string>;
  trailingChild?: Child;
  focusRequests?: Occurrence<void>;
  onSearch: (query: string) => void;
  searchElsewhere?: (query: string) => void;
}

export function SearchBox({ label, query, trailingChild, focusRequests, onSearch, searchElsewhere }: SearchBoxProps): HTMLElement {
  const input = <input className={SearchBoxClass.input} type="search" spellcheck={false}
    placeholder={label} aria-label={label} value={query} /> as HTMLInputElement;
  const submitButton = <IconButton className={SearchBoxClass.submit} icon="search" label="Search" type="submit" />;

  if (focusRequests !== undefined) {
    onCleanup(focusRequests.on(() => input.focus()));
  }

  if (searchElsewhere !== undefined) {
    submitButton.addEventListener("contextmenu", event => {
      event.preventDefault();
      searchElsewhere(input.value);
    });
    submitButton.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        searchElsewhere(input.value);
      }
    });
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
        {submitButton}
        {input}
        <IconButton
          className={SearchBoxClass.clear}
          icon="close"
          label="Clear search"
          onClick={() => {
            input.value = "";
            input.focus();
          }}
        />
        {trailingChild}
      </form>
    </search>
  );
}
