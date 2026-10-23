import { PageSlot, PageSlotClass } from "@/core/ui/components/paginator/page_slot";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import PAGE_SLOT_CSS from "@/core/ui/components/paginator/page_slot.css?inline";
import { PageTerm } from "@/core/ui/components/paginator/page_sequence";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  element: HTMLElement;
  term: Signal<PageTerm | undefined>;
  isJumpOpen: Signal<boolean>;
  onPageChange: (pageNumber: number) => void;
  onJumpOpen: () => void;
}

function setup(term: PageTerm | undefined, current = 2): Setup {
  const options = { term: new Signal(term), isJumpOpen: new Signal(false), onPageChange: vi.fn(), onJumpOpen: vi.fn() };
  const { result: element } = render(document, () => <PageSlot {...options} current={new Signal(current)} />);
  return { ...options, element };
}

function readShown(element: HTMLElement): string[] {
  return [...element.querySelectorAll<HTMLButtonElement>("button:not([hidden])")].map(button => button.textContent);
}

describe("PageSlot", () => {
  test("shows a page, a gap, or nothing", () => {
    const { element, term } = setup(5);

    expect(readShown(element)).toEqual(["5"]);
    term.value = "gap";
    expect(readShown(element)).toEqual(["…"]);
    term.value = undefined;
    expect(readShown(element)).toEqual([]);
  });

  test("marks the current page", () => {
    expect(setup(2).element.querySelector("[aria-current]")?.getAttribute("aria-current")).toBe("page");
    expect(setup(3).element.querySelector("[aria-current]")).toBeNull();
  });

  test("reports a clicked page other than the current one", () => {
    const other = setup(5);
    const current = setup(2);

    other.element.querySelector<HTMLButtonElement>("[data-page-number]")!.click();
    current.element.querySelector<HTMLButtonElement>("[data-page-number]")!.click();
    expect(vi.mocked(other.onPageChange).mock.calls).toEqual([[5]]);
    expect(current.onPageChange).not.toHaveBeenCalled();
  });

  test("opens the jump from a gap and reflects whether it is open", () => {
    const { element, isJumpOpen, onJumpOpen } = setup("gap");
    const gap = element.querySelector<HTMLButtonElement>("[aria-haspopup]")!;

    gap.click();
    isJumpOpen.value = true;
    expect([vi.mocked(onJumpOpen).mock.calls.length, gap.getAttribute("aria-expanded")]).toEqual([1, "true"]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(PageSlotClass, PAGE_SLOT_CSS);
  });
});
