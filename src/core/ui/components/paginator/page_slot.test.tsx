import { PageSlot, PageSlotClass } from "@/core/ui/components/paginator/page_slot";
import { afterEach, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import PAGE_SLOT_CSS from "@/core/ui/components/paginator/page_slot.css?inline";
import { PageTerm } from "@/core/ui/components/paginator/page_term";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

interface Setup {
  element: HTMLElement;
  term: Signal<PageTerm | undefined>;
  onPageChange: (pageNumber: number) => void;
}

function setup(term: PageTerm | undefined, current = 2): Setup {
  const options = { term: new Signal(term), onPageChange: vi.fn() };
  const { result: element } = render(document, () => <PageSlot {...options} current={new Signal(current)} pageCount={new Signal(20)} />);

  document.body.append(element);
  return { ...options, element };
}

function readShown(element: HTMLElement): string[] {
  return [...element.querySelectorAll<HTMLButtonElement>("button:not([hidden])")].map(button => button.textContent);
}

function openField(element: HTMLElement): HTMLInputElement {
  element.querySelector<HTMLButtonElement>("[aria-label='Go to page']")!.click();
  return element.querySelector("input")!;
}

function enter(field: HTMLInputElement, value: string): void {
  field.value = value;
  field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
}

afterEach(() => {
  document.body.replaceChildren();
});

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
    const otherSetup = setup(5);
    const currentSetup = setup(2);

    otherSetup.element.querySelector<HTMLButtonElement>("[data-page-number]")!.click();
    currentSetup.element.querySelector<HTMLButtonElement>("[data-page-number]")!.click();
    expect(vi.mocked(otherSetup.onPageChange).mock.calls).toEqual([[5]]);
    expect(currentSetup.onPageChange).not.toHaveBeenCalled();
  });

  test("replaces a clicked gap with a focused field", () => {
    const { element } = setup("gap");
    const field = openField(element);

    expect([readShown(element), field.hidden, document.activeElement === field]).toEqual([[], false, true]);
  });

  test("reports a page entered in the field, clamped to the page range", () => {
    const { element, onPageChange } = setup("gap");

    enter(openField(element), "15");
    enter(openField(element), "99");
    enter(openField(element), "0");
    expect(vi.mocked(onPageChange).mock.calls).toEqual([[15], [20], [1]]);
  });

  test("ignores an empty entry and the current page", () => {
    const { element, onPageChange } = setup("gap");

    enter(openField(element), "");
    enter(openField(element), "2");
    expect(onPageChange).not.toHaveBeenCalled();
  });

  test("turns back into a gap once the field loses focus", () => {
    const { element } = setup("gap");
    const field = openField(element);

    field.value = "15";
    field.blur();
    expect([readShown(element), field.hidden, field.value]).toEqual([["…"], true, ""]);
  });

  test("turns back into a gap on Escape", () => {
    const { element, onPageChange } = setup("gap");
    const field = openField(element);

    field.value = "15";
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(readShown(element)).toEqual(["…"]);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  test("keeps the field open on other keys", () => {
    const { element, onPageChange } = setup("gap");
    const field = openField(element);

    field.value = "15";
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "5", bubbles: true }));
    expect([field.hidden, field.value, vi.mocked(onPageChange).mock.calls]).toEqual([false, "15", []]);
  });

  test("reports nothing from the page button of a gap", () => {
    const { element, onPageChange } = setup("gap");

    element.querySelector<HTMLButtonElement>(`.${PageSlotClass.page}`)!.click();
    expect(onPageChange).not.toHaveBeenCalled();
  });

  test("styles every class it sets", () => {
    expectClassesStyled(PageSlotClass, PAGE_SLOT_CSS);
  });
});
