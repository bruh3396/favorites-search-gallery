import { Readable, computed } from "@/core/utils/reactive/signal";
import { PageTerm } from "@/core/ui/components/paginator/page_sequence";
import { h } from "@/core/ui/h/h";

export const PageSlotClass = {
  root: "fsg-PageSlot",
  page: "fsg-PageSlot-page",
  gap: "fsg-PageSlot-gap"
} as const;

export interface PageSlotProps {
  term: Readable<PageTerm | undefined>;
  current: Readable<number>;
  isJumpOpen: Readable<boolean>;
  onPageChange: (pageNumber: number) => void;
  onJumpOpen: () => void;
}

export function PageSlot({ term, current, isJumpOpen, onPageChange, onJumpOpen }: PageSlotProps): HTMLElement {
  const page = computed(() => (typeof term.value === "number" ? term.value : null));
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

          if (clicked !== null && clicked !== current.peek()) {
            onPageChange(clicked);
          }
        }}
      >
        {computed(() => String(page.value ?? ""))}
      </button>
      <button
        className={PageSlotClass.gap}
        type="button"
        aria-label="Go to page"
        aria-haspopup="dialog"
        aria-expanded={computed(() => String(isJumpOpen.value))}
        hidden={computed(() => term.value !== "gap")}
        onClick={onJumpOpen}
      >
        …
      </button>
    </li>
  );
}
