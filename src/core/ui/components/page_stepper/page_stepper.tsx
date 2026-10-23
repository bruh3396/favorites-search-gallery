import { Readable, computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const PageStepperClass = {
  root: "fsg-PageStepper",
  step: "fsg-PageStepper-step",
  field: "fsg-PageStepper-field",
  total: "fsg-PageStepper-total"
} as const;

export interface PageStepperProps {
  pageNumber: Readable<number>;
  pageCount: Readable<number>;
  onPageChange: (pageNumber: number) => void;
}

interface StepButtonProps {
  label: string;
  text: string;
  target: Readable<number>;
  pageCount: Readable<number>;
  onPageChange: (pageNumber: number) => void;
}

export function PageStepper({ pageNumber, pageCount, onPageChange }: PageStepperProps): HTMLElement {
  const field = (
    <input
      className={PageStepperClass.field}
      type="text"
      inputMode="numeric"
      autocomplete="off"
      aria-label={computed(() => `Page, of ${pageCount.value.toLocaleString()}`)}
      size={computed(() => String(pageCount.value).length)}
      value={computed(() => String(pageNumber.value))}
      onFocus={() => field.select()}
      onChange={() => commit()}
      onKeyDown={event => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        } else if (event.key === "Escape") {
          restore();
          field.blur();
        }
      }}
    />
  ) as HTMLInputElement;

  function restore(): void {
    field.value = String(pageNumber.peek());
  }

  function commit(): void {
    const typed = Number.parseInt(field.value, 10);
    const target = Math.min(pageCount.peek(), Math.max(1, typed));

    if (!Number.isNaN(typed) && target !== pageNumber.peek()) {
      onPageChange(target);
    }
    restore();
  }

  return (
    <nav className={PageStepperClass.root} aria-label="Pages" hidden={computed(() => pageCount.value <= 1)}>
      <StepButton label="Previous page" text="‹" target={computed(() => pageNumber.value - 1)} pageCount={pageCount} onPageChange={onPageChange} />
      {field}
      <span className={PageStepperClass.total}>{computed(() => `/ ${pageCount.value.toLocaleString()}`)}</span>
      <StepButton label="Next page" text="›" target={computed(() => pageNumber.value + 1)} pageCount={pageCount} onPageChange={onPageChange} />
    </nav>
  );
}

function StepButton({ label, text, target, pageCount, onPageChange }: StepButtonProps): HTMLElement {
  return (
    <button
      className={PageStepperClass.step}
      type="button"
      aria-label={label}
      disabled={computed(() => target.value < 1 || target.value > pageCount.value)}
      onClick={() => onPageChange(target.peek())}
    >
      {text}
    </button>
  );
}
