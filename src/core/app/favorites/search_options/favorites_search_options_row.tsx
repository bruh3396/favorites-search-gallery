import { Child, h } from "@/core/ui/h/h";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";

export const FavoritesSearchOptionsRowClass = {
  root: "fsg-FavoritesSearchOptionsRow",
  reset: "fsg-FavoritesSearchOptionsRow-reset"
} as const;

export interface FavoritesSearchOptionsRowProps {
  changedSearchOptionCount: Readable<number>;
  resetSearchOptions: () => void;
  children: Child;
}

export function FavoritesSearchOptionsRow({ changedSearchOptionCount, resetSearchOptions, children }: FavoritesSearchOptionsRowProps): HTMLElement {
  return (
    <div className={FavoritesSearchOptionsRowClass.root} role="group" aria-label="Search Options">
      {children}
      <IconButton
        className={FavoritesSearchOptionsRowClass.reset}
        icon="reset"
        label="Reset Search Options"
        size="small"
        disabled={computed(() => changedSearchOptionCount.value === 0)}
        onClick={resetSearchOptions}
      />
    </div>
  );
}
