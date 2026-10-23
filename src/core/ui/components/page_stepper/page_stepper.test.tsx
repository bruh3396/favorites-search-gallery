import { PageStepper, PageStepperClass } from "@/core/ui/components/page_stepper/page_stepper";
import { afterEach, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import PAGE_STEPPER_CSS from "@/core/ui/components/page_stepper/page_stepper.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  element: HTMLElement;
  field: HTMLInputElement;
  pageNumber: Signal<number>;
  pageCount: Signal<number>;
  onPageChange: (pageNumber: number) => void;
  dispose: () => void;
}

function setup({ pageNumber = 3, pageCount = 288 } = {}): Setup {
  const options = { pageNumber: new Signal(pageNumber), pageCount: new Signal(pageCount), onPageChange: vi.fn() };
  const { result: element, dispose } = render(document, () => <PageStepper {...options} />);

  document.body.append(element);
  return { ...options, element, field: element.querySelector<HTMLInputElement>(`.${PageStepperClass.field}`)!, dispose };
}

function findButton(element: HTMLElement, label: string): HTMLButtonElement {
  return element.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
}

function type(field: HTMLInputElement, text: string, key = "Enter"): void {
  field.value = text;
  field.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("PageStepper", () => {
  test("shows the current page against the page count", () => {
    const { element, field } = setup();

    expect([field.value, element.querySelector(`.${PageStepperClass.total}`)!.textContent]).toEqual(["3", "/ 288"]);
  });

  test("steps to the previous and next pages", () => {
    const { element, onPageChange } = setup({ pageNumber: 5 });

    findButton(element, "Previous page").click();
    findButton(element, "Next page").click();
    expect(vi.mocked(onPageChange).mock.calls).toEqual([[4], [6]]);
  });

  test("disables stepping past either end", () => {
    const first = setup({ pageNumber: 1, pageCount: 3 });
    const last = setup({ pageNumber: 3, pageCount: 3 });

    expect([
      findButton(first.element, "Previous page").disabled,
      findButton(first.element, "Next page").disabled,
      findButton(last.element, "Next page").disabled
    ]).toEqual([true, false, true]);
  });

  test("goes to a typed page on Enter", () => {
    const { field, onPageChange } = setup();

    type(field, "144");
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(144);
  });

  test("goes to a typed page once the field changes", () => {
    const { field, onPageChange } = setup();

    field.value = "144";
    field.dispatchEvent(new Event("change"));
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(144);
  });

  test("clamps a typed page to the first and last pages", () => {
    const { field, onPageChange } = setup();

    type(field, "999");
    type(field, "0");
    expect(vi.mocked(onPageChange).mock.calls).toEqual([[288], [1]]);
  });

  test("restores the current page after an entry that isn't a number", () => {
    const { field, onPageChange } = setup();

    type(field, "abc");
    expect([field.value, vi.mocked(onPageChange).mock.calls]).toEqual(["3", []]);
  });

  test("restores the current page after the current page is typed", () => {
    const { field, onPageChange } = setup();

    type(field, "03");
    expect([field.value, vi.mocked(onPageChange).mock.calls]).toEqual(["3", []]);
  });

  test("restores the current page on Escape without going anywhere", () => {
    const { field, onPageChange } = setup();

    type(field, "144", "Escape");
    expect([field.value, vi.mocked(onPageChange).mock.calls]).toEqual(["3", []]);
  });

  test("follows the page number and the page count", () => {
    const { element, field, pageNumber, pageCount } = setup();

    pageCount.value = 300;
    pageNumber.value = 7;
    expect([field.value, element.querySelector(`.${PageStepperClass.total}`)!.textContent]).toEqual(["7", "/ 300"]);
  });

  test("hides itself while there is only one page", () => {
    const { element, pageCount } = setup({ pageNumber: 1, pageCount: 1 });

    expect(element.hidden).toBe(true);
    pageCount.value = 2;
    expect(element.hidden).toBe(false);
  });

  test("stops following once disposed", () => {
    const { field, pageNumber, dispose } = setup();

    dispose();
    pageNumber.value = 7;
    expect(field.value).toBe("3");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(PageStepperClass, PAGE_STEPPER_CSS);
  });
});
