import { Paginator, PaginatorClass, createPaginator } from "@/core/ui/components/paginator/paginator";
import { afterEach, describe, expect, test, vi } from "vitest";
import PAGINATOR_CSS from "@/core/ui/components/paginator/paginator.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

interface Setup extends Paginator {
  pageNumber: Signal<number>;
  pageCount: Signal<number>;
  onPageChange: (pageNumber: number) => void;
}

function setup({ pageNumber = 1, pageCount = 10 } = {}): Setup {
  const options = { pageNumber: new Signal(pageNumber), pageCount: new Signal(pageCount), onPageChange: vi.fn() };
  const paginator = createPaginator(document, options);

  document.body.append(paginator.element);
  return { ...paginator, ...options };
}

function readItems(element: HTMLElement): string[] {
  return [...element.querySelectorAll("li:not([hidden]) > :not([hidden])")].map(item => item.textContent);
}

function findButton(element: HTMLElement, label: string): HTMLButtonElement {
  return [...element.querySelectorAll("button")].find(button => (button.getAttribute("aria-label") ?? button.textContent) === label)!;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("createPaginator", () => {
  test("is a labelled navigation landmark", () => {
    const { element } = setup();

    expect(element.tagName).toBe("NAV");
    expect(element.getAttribute("aria-label")).toBe("Pagination");
  });

  test("lists the pages around the current one with gaps for the rest", () => {
    expect(readItems(setup({ pageNumber: 10, pageCount: 20 }).element)).toEqual(["1", "…", "8", "9", "10", "11", "12", "…", "20"]);
  });

  test("marks only the current page", () => {
    const { element } = setup({ pageNumber: 2 });

    expect([...element.querySelectorAll("[aria-current]")].map(button => [button.textContent, button.getAttribute("aria-current")])).toEqual([["2", "page"]]);
  });

  test("follows the page number and the page count", () => {
    const { element, pageNumber, pageCount } = setup({ pageNumber: 1, pageCount: 3 });

    pageCount.value = 5;
    pageNumber.value = 4;
    expect(readItems(element)).toEqual(["1", "2", "3", "4", "5"]);
    expect(element.querySelector("[aria-current]")?.textContent).toBe("4");
  });

  test("keeps its page buttons across a page change", () => {
    const { element, pageNumber } = setup({ pageNumber: 1, pageCount: 20 });
    const buttons = [...element.querySelectorAll("button")];

    pageNumber.value = 10;
    expect([...element.querySelectorAll("button")]).toEqual(buttons);
    expect(readItems(element)).toEqual(["1", "…", "8", "9", "10", "11", "12", "…", "20"]);
  });

  test("reports a clicked page", () => {
    const { element, onPageChange } = setup();

    findButton(element, "3").click();
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(3);
  });

  test("does not report the current page", () => {
    const { element, onPageChange } = setup({ pageNumber: 2 });

    findButton(element, "2").click();
    expect(onPageChange).not.toHaveBeenCalled();
  });

  test("steps to the previous and next pages", () => {
    const { element, onPageChange } = setup({ pageNumber: 5 });

    findButton(element, "Previous page").click();
    findButton(element, "Next page").click();
    expect(onPageChange).toHaveBeenNthCalledWith(1, 4);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 6);
  });

  test("disables stepping past either end", () => {
    const first = setup({ pageNumber: 1, pageCount: 3 });
    const last = setup({ pageNumber: 3, pageCount: 3 });

    expect(findButton(first.element, "Previous page").disabled).toBe(true);
    expect(findButton(first.element, "Next page").disabled).toBe(false);
    expect(findButton(last.element, "Next page").disabled).toBe(true);
  });

  test("hides itself while there is only one page", () => {
    const { element, pageCount } = setup({ pageCount: 1 });

    expect(element.hidden).toBe(true);
    pageCount.value = 2;
    expect(element.hidden).toBe(false);
  });

  test("stops following once disposed", () => {
    const { element, pageNumber, dispose } = setup({ pageNumber: 1, pageCount: 3 });

    dispose();
    pageNumber.value = 3;
    expect(element.querySelector("[aria-current]")?.textContent).toBe("1");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(PaginatorClass, PAGINATOR_CSS);
  });
});
