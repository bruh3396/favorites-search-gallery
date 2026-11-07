import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { PageTerm } from "@/core/ui/components/paginator/page_term";
import { h } from "@/core/ui/h/h";

export const PageSlotClass = {
  root: "fsg-PageSlot",
  page: "fsg-PageSlot-page",
  gap: "fsg-PageSlot-gap",
  field: "fsg-PageSlot-field"
} as const;

export interface PageSlotProps {
  term: Readable<PageTerm | undefined>;
  current: Readable<number>;
  pageCount: Readable<number>;
  onPageChange: (pageNumber: number) => void;
}

export function PageSlot({ term, current, pageCount, onPageChange }: PageSlotProps): HTMLElement {
  const page = computed(() => (typeof term.value === "number" ? term.value : null));
  const isEditing = new Signal(false);
  const goToIfChanged = (pageNumber: number): void => {
    if (pageNumber !== current.peek()) {
      onPageChange(pageNumber);
    }
  };
  const field = (
    <input
      className={PageSlotClass.field}
      type="number"
      aria-label="Go to Page"
      min="1"
      max={computed(() => String(pageCount.value))}
      hidden={computed(() => term.value !== "gap" || !isEditing.value)}
      onKeydown={event => {
        if (event.key === "Enter") {
          const typed = event.currentTarget.valueAsNumber;

          event.currentTarget.blur();

          if (!Number.isNaN(typed)) {
            goToIfChanged(Math.min(pageCount.peek(), Math.max(1, typed)));
          }
        } else if (event.key === "Escape") {
          event.currentTarget.blur();
        }
      }}
      onBlur={event => {
        event.currentTarget.value = "";
        isEditing.value = false;
      }}
    />
  ) as HTMLInputElement;
  return (
    <li className={PageSlotClass.root}>
      <button
        className={PageSlotClass.page}
        type="button"
        hidden={computed(() => page.value === null)}
        dataset={{ pageNumber: computed(() => String(page.value ?? "")) }}
        aria-current={computed(() => (page.value !== null && page.value === current.value ? "page" : null))}
        onClick={() => {
          const clicked = page.peek();

          if (clicked !== null) {
            goToIfChanged(clicked);
          }
        }}
      >
        {computed(() => String(page.value ?? ""))}
      </button>
      <button
        className={PageSlotClass.gap}
        type="button"
        aria-label="Go to Page"
        hidden={computed(() => term.value !== "gap" || isEditing.value)}
        onClick={() => {
          isEditing.value = true;
          field.focus();
        }}
      >
        …
      </button>
      {field}
    </li>
  );
}
