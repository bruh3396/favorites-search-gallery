import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { Stepper, StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { h } from "@/core/ui/h/h";

export const PageJumpClass = {
  root: "fsg-PageJump",
  submit: "fsg-PageJump-submit"
} as const;

export interface PageJumpProps {
  isOpen: Readable<boolean>;
  pageNumber: Readable<number>;
  pageCount: Readable<number>;
  scheduler: StepperScheduler;
  onPageChange: (pageNumber: number) => void;
  onClose: () => void;
}

export function PageJump({ isOpen, pageNumber, pageCount, scheduler, onPageChange, onClose }: PageJumpProps): HTMLElement {
  const draft = new Signal(pageNumber.peek());

  effect(() => {
    if (isOpen.value) {
      draft.value = pageNumber.peek();
    }
  });
  return (
    <form
      className={PageJumpClass.root}
      role="dialog"
      aria-label="Go to page"
      noValidate
      hidden={computed(() => !isOpen.value)}
      onSubmit={event => {
        event.preventDefault();

        if (draft.peek() !== pageNumber.peek()) {
          onPageChange(draft.peek());
        }
        onClose();
      }}
      onKeydown={event => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
      onFocusout={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          onClose();
        }
      }}
    >
      <Stepper
        label="Page"
        min={1}
        max={pageCount}
        size="small"
        isFocused={isOpen}
        scheduler={scheduler}
        value={draft}
        onValueChange={next => {
          draft.value = next;
        }}
      />
      <button className={PageJumpClass.submit} type="submit">Go</button>
    </form>
  );
}