import { Icon, createIcon } from "@/core/ui/components/icon/icon";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { PageSlot } from "@/core/ui/components/paginator/page_slot";
import { h } from "@/core/ui/h/h";
import { listPageTerms } from "@/core/ui/components/paginator/page_term_lister";

export const PaginatorClass = {
  root: "fsg-Paginator",
  list: "fsg-Paginator-list",
  step: "fsg-Paginator-step",
  icon: "fsg-Paginator-icon"
} as const;

export interface PaginatorProps {
  pageNumber: Readable<number>;
  pageCount: Readable<number>;
  onPageChange: (pageNumber: number) => void;
}

interface StepButtonProps {
  label: string;
  icon: Icon;
  target: Readable<number>;
  pageCount: Readable<number>;
  onPageChange: (pageNumber: number) => void;
}

const SLOT_COUNT = 7;

export function Paginator({ pageNumber, pageCount, onPageChange }: PaginatorProps): HTMLElement {
  const terms = computed(() => listPageTerms({ pageNumber: pageNumber.value, pageCount: pageCount.value, slotCount: SLOT_COUNT }));
  const root = (
    <nav
      className={PaginatorClass.root}
      aria-label="Pagination"
      inert={computed(() => pageCount.value <= 1)}
    >
      <StepButton label="Previous Page" icon="chevronLeft" target={computed(() => pageNumber.value - 1)} pageCount={pageCount} onPageChange={onPageChange} />
      <ul className={PaginatorClass.list}>
        {Array.from({ length: SLOT_COUNT }, (_, index) => (
          <PageSlot term={computed(() => terms.value[index])} current={pageNumber} pageCount={pageCount} onPageChange={onPageChange} />
        ))}
      </ul>
      <StepButton label="Next Page" icon="chevronRight" target={computed(() => pageNumber.value + 1)} pageCount={pageCount} onPageChange={onPageChange} />
    </nav>
  );

  effect(() => root.style.setProperty("--fsg-Paginator-digits", String(String(pageCount.value).length)));
  return root;
}

function StepButton({ label, icon, target, pageCount, onPageChange }: StepButtonProps): HTMLElement {
  return (
    <button
      className={PaginatorClass.step}
      type="button"
      aria-label={label}
      dataset={{ pageNumber: computed(() => String(target.value)) }}
      disabled={computed(() => target.value < 1 || target.value > pageCount.value)}
      onClick={() => onPageChange(target.peek())}
    >
      {createIcon(icon, PaginatorClass.icon)}
    </button>
  );
}
