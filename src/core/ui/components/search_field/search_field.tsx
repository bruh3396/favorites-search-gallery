import { Readable } from "@/core/utils/reactive/signal";
import { createIcon } from "@/core/ui/components/icon/icon";
import { h } from "@/core/ui/h/h";

export const SearchFieldClass = {
  root: "fsg-SearchField",
  icon: "fsg-SearchField-icon",
  input: "fsg-SearchField-input"
} as const;

export interface SearchFieldProps {
  label: string;
  value: Readable<string>;
  onValueChange: (value: string) => void;
}

export function SearchField({ label, value, onValueChange }: SearchFieldProps): HTMLElement {
  return (
    <label className={SearchFieldClass.root}>
      {createIcon("search", SearchFieldClass.icon)}
      <input
        className={SearchFieldClass.input}
        type="search"
        placeholder={label}
        aria-label={label}
        value={value}
        onInput={event => onValueChange(event.currentTarget.value)}
      />
    </label>
  );
}
