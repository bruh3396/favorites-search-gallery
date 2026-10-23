import { PageJump, PageJumpClass } from "@/core/ui/components/paginator/page_jump";
import { afterEach, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import PAGE_JUMP_CSS from "@/core/ui/components/paginator/page_jump.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  element: HTMLFormElement;
  field: HTMLInputElement;
  isOpen: Signal<boolean>;
  onPageChange: (pageNumber: number) => void;
}

function setup({ pageNumber = 10, pageCount = 20 } = {}): Setup {
  const isOpen = new Signal(false);
  const onPageChange = vi.fn();
  const { result } = render(document, () => (
    <PageJump
      isOpen={isOpen}
      pageNumber={new Signal(pageNumber)}
      pageCount={new Signal(pageCount)}
      scheduler={new MemoryScheduler()}
      onPageChange={onPageChange}
      onClose={() => {
        isOpen.value = false;
      }}
    />
  ));
  const element = result as HTMLFormElement;

  document.body.append(element);
  isOpen.value = true;
  return { element, field: element.querySelector("input")!, isOpen, onPageChange };
}

function submit({ element, field, isOpen }: Setup, value: string): void {
  isOpen.value = true;
  field.value = value;
  field.dispatchEvent(new Event("change"));
  element.requestSubmit();
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("PageJump", () => {
  test("opens on the current page with its field focused", () => {
    const { element, field } = setup();

    expect([element.hidden, field.value, document.activeElement === field]).toEqual([false, "10", true]);
  });

  test("goes to the submitted page and closes", () => {
    const jump = setup();

    submit(jump, "15");
    expect([vi.mocked(jump.onPageChange).mock.calls, jump.element.hidden]).toEqual([[[15]], true]);
  });

  test("clamps a submitted page to the first and last pages", () => {
    const jump = setup();

    submit(jump, "99");
    submit(jump, "0");
    expect(vi.mocked(jump.onPageChange).mock.calls).toEqual([[20], [1]]);
  });

  test("steps from the current page", () => {
    const jump = setup();

    jump.element.querySelector<HTMLButtonElement>("[aria-label=Increase]")!.click();
    jump.element.requestSubmit();
    expect(vi.mocked(jump.onPageChange).mock.calls).toEqual([[11]]);
  });

  test("closes without going anywhere after an empty entry", () => {
    const jump = setup();

    submit(jump, "");
    expect([vi.mocked(jump.onPageChange).mock.calls, jump.element.hidden]).toEqual([[], true]);
  });

  test("closes on Escape", () => {
    const { element, field } = setup();

    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(element.hidden).toBe(true);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(PageJumpClass, PAGE_JUMP_CSS);
  });
});
