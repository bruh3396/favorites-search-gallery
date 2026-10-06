import { PageTerm, getPageSequence } from "@/core/ui/components/paginator/page_sequence";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const PaginatorClass = {
  root: "fsg-Paginator",
  list: "fsg-Paginator-list",
  step: "fsg-Paginator-step",
  page: "fsg-Paginator-page",
  gap: "fsg-Paginator-gap"
} as const;

export interface PaginatorProps {
  pageNumber: Readable<number>;
  pageCount: Readable<number>;
  onPageChange: (pageNumber: number) => void;
}

interface StepButtonProps {
  label: string;
  text: string;
  target: Readable<number>;
  pageCount: Readable<number>;
}

interface SlotProps {
  term: Readable<PageTerm | undefined>;
  current: Readable<number>;
}

const NEARBY_PAGE_COUNT = 5;
const SLOT_COUNT = NEARBY_PAGE_COUNT + 4;

// WAI-ARIA pagination: a labelled nav landmark, the current page marked with aria-current.
// The items are a fixed pool of slots patched in place, so a page change keeps the focused button.
export function Paginator({ pageNumber, pageCount, onPageChange }: PaginatorProps): HTMLElement {
  const terms = computed(() => getPageSequence({ pageNumber: pageNumber.value, pageCount: pageCount.value, nearbyCount: NEARBY_PAGE_COUNT }));

  return (
    <nav
      className={PaginatorClass.root}
      aria-label="Pagination"
      hidden={computed(() => pageCount.value <= 1)}
      onClick={(event) => reportClickedPage(event, onPageChange)}
    >
      <StepButton label="Previous page" text="‹" target={computed(() => pageNumber.value - 1)} pageCount={pageCount} />
      <ul className={PaginatorClass.list}>
        {Array.from({ length: SLOT_COUNT }, (_, index) => <Slot term={computed(() => terms.value[index])} current={pageNumber} />)}
      </ul>
      <StepButton label="Next page" text="›" target={computed(() => pageNumber.value + 1)} pageCount={pageCount} />
    </nav>
  );
}

function reportClickedPage(event: MouseEvent, onPageChange: (pageNumber: number) => void): void {
  const button = (event.target as Element).closest<HTMLButtonElement>("button[data-page-number]");

  if (button !== null && !button.disabled && !button.hasAttribute("aria-current")) {
    onPageChange(Number(button.dataset.pageNumber));
  }
}

function StepButton({ label, text, target, pageCount }: StepButtonProps): HTMLElement {
  return (
    <button
      className={PaginatorClass.step}
      type="button"
      aria-label={label}
      dataset={{ pageNumber: computed(() => String(target.value)) }}
      disabled={computed(() => target.value < 1 || target.value > pageCount.value)}
    >
      {text}
    </button>
  );
}

// A slot past the end of the sequence hides; a gap slot hides its button, so a stale page number is never visible or clickable.
function Slot({ term, current }: SlotProps): HTMLElement {
  const page = computed(() => typeof term.value === "number" ? term.value : null);

  return (
    <li hidden={computed(() => term.value === undefined)}>
      <button
        className={PaginatorClass.page}
        type="button"
        hidden={computed(() => page.value === null)}
        dataset={{ pageNumber: computed(() => String(page.value ?? "")) }}
        aria-current={computed(() => page.value !== null && page.value === current.value ? "page" : null)}
      >
        {computed(() => String(page.value ?? ""))}
      </button>
      <span className={PaginatorClass.gap} aria-hidden="true" hidden={computed(() => term.value !== "gap")}>…</span>
    </li>
  );
}
