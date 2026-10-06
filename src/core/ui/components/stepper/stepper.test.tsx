import { Mock, describe, expect, test, vi } from "vitest";
import { Stepper, StepperClass, StepperProps, StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { h, render } from "@/core/ui/h/h";
import STEPPER_CSS from "@/core/ui/components/stepper/stepper.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

interface PendingTask {
  task: () => void;
  delay: number;
}

// Runs scheduled tasks only when the test says so.
function createScheduler(): StepperScheduler & { runNext: () => number } {
  let pending: PendingTask | undefined;
  return {
    schedule: (task, delay): (() => void) => {
      const entry = { task, delay };

      pending = entry;
      return (): void => {
        if (pending === entry) {
          pending = undefined;
        }
      };
    },
    runNext: (): number => {
      const entry = pending;

      if (entry === undefined) {
        return -1;
      }
      pending = undefined;
      entry.task();
      return entry.delay;
    }
  };
}

type OnValueChange = Mock<(next: number) => void>;

type SetupOptions = Partial<Omit<StepperProps, "value" | "disabled" | "onValueChange" | "scheduler">> & {
  initial?: number;
  // Writes each reported value back, closing the controlled loop the way a caller does.
  writesBack?: boolean;
};

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  value: Signal<number>;
  disabled: Signal<boolean>;
  onValueChange: OnValueChange;
  scheduler: ReturnType<typeof createScheduler>;
  input: HTMLInputElement;
  decrement: HTMLButtonElement;
  increment: HTMLButtonElement;
}

function setup({ initial = 0, writesBack = false, ...options }: SetupOptions = {}): Setup {
  const value = new Signal(initial);
  const disabled = new Signal(false);
  const onValueChange = vi.fn<(next: number) => void>(next => {
    if (writesBack) {
      value.value = next;
    }
  });
  const scheduler = createScheduler();
  const { result: element, dispose } = render(document, () => (
    <Stepper label="Count" min={0} max={10} {...options} value={value} disabled={disabled} onValueChange={onValueChange} scheduler={scheduler} />
  ));
  const [decrement, increment] = element.querySelectorAll("button");
  return { element, dispose, value, disabled, onValueChange, scheduler, input: element.querySelector("input")!, decrement, increment };
}

function press(button: HTMLButtonElement): void {
  button.dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
}

function release(button: HTMLButtonElement): void {
  button.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
}

function type(input: HTMLInputElement, text: string): void {
  input.value = text;
  input.dispatchEvent(new Event("change"));
}

function keyDown(input: HTMLInputElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, cancelable: true });

  input.dispatchEvent(event);
  return event;
}

describe("Stepper", () => {
  test("is a named number input between decrease and increase buttons that stay out of the tab order", () => {
    const { element, input, decrement, increment } = setup({ step: 2 });

    expect([...element.children]).toEqual([decrement, input, increment]);
    expect([input.type, input.min, input.max, input.step]).toEqual(["number", "0", "10", "2"]);
    expect(input.getAttribute("aria-label")).toBe("Count");
    expect([decrement.getAttribute("aria-label"), increment.getAttribute("aria-label")]).toEqual(["Decrease", "Increase"]);
    expect([decrement.tabIndex, increment.tabIndex]).toEqual([-1, -1]);
  });

  test("is medium unless told otherwise", () => {
    expect(setup().element.dataset.size).toBe("medium");
    expect(setup({ size: "small" }).element.dataset.size).toBe("small");
  });

  test("follows its value and disables the button at each bound", () => {
    const { input, decrement, increment, value } = setup();

    expect([input.value, decrement.disabled, increment.disabled]).toEqual(["0", true, false]);
    value.value = 10;
    expect([input.value, decrement.disabled, increment.disabled]).toEqual(["10", false, true]);
  });

  test("reports one step on press without changing itself", () => {
    const { input, increment, onValueChange } = setup({ initial: 4 });

    press(increment);
    expect(onValueChange).toHaveBeenLastCalledWith(5);
    expect(input.value).toBe("4");
  });

  test("snaps an off-grid value onto the step grid", () => {
    const { decrement, increment, onValueChange } = setup({ initial: 12, step: 5, max: 100 });

    press(increment);
    expect(onValueChange).toHaveBeenLastCalledWith(15);
    press(decrement);
    expect(onValueChange).toHaveBeenLastCalledWith(10);
  });

  test("walks every decimal step up to the max and back down to the min", () => {
    const { decrement, increment, onValueChange } = setup({ step: 0.1, max: 1, writesBack: true });
    const tenths = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

    tenths.forEach(() => press(increment));
    tenths.forEach(() => press(decrement));
    expect(onValueChange.mock.calls.flat()).toEqual([...tenths, ...tenths.slice(0, -1).reverse(), 0]);
  });

  test("repeats while held, from its current value, after a pause", () => {
    const { increment, onValueChange, scheduler } = setup({ writesBack: true });

    press(increment);
    expect(scheduler.runNext()).toBe(400);
    expect(scheduler.runNext()).toBe(60);
    expect(onValueChange.mock.calls.flat()).toEqual([1, 2, 3]);
  });

  test("stops repeating on release", () => {
    const { increment, scheduler } = setup();

    press(increment);
    release(increment);
    expect(scheduler.runNext()).toBe(-1);
  });

  test("stops repeating at the bound", () => {
    const { increment, onValueChange, scheduler } = setup({ initial: 1, max: 2, writesBack: true });

    press(increment);
    scheduler.runNext();
    expect(onValueChange.mock.calls.flat()).toEqual([2]);
    expect(scheduler.runNext()).toBe(-1);
  });

  test("steps with the arrow keys instead of letting the input change itself", () => {
    const { input, onValueChange } = setup({ initial: 5 });

    expect(keyDown(input, "ArrowUp").defaultPrevented).toBe(true);
    expect(onValueChange).toHaveBeenLastCalledWith(6);
    keyDown(input, "ArrowDown");
    expect(onValueChange).toHaveBeenLastCalledWith(4);
  });

  test("reports a typed value clamped to the bounds, and shows its current value until it changes", () => {
    const { input, onValueChange } = setup({ initial: 3 });

    type(input, "42");
    expect(onValueChange).toHaveBeenLastCalledWith(10);
    expect(input.value).toBe("3");
  });

  test("restores its current value when the typed text is not a number or is unchanged", () => {
    const { input, onValueChange } = setup({ initial: 3 });

    type(input, "");
    type(input, "3");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input.value).toBe("3");
  });

  test("commits once, on release, the value a held press ends on", () => {
    const onValueCommit = vi.fn<(value: number) => void>();
    const { increment, scheduler } = setup({ onValueCommit, writesBack: true });

    press(increment);
    scheduler.runNext();
    scheduler.runNext();
    expect(onValueCommit).not.toHaveBeenCalled();
    release(increment);
    expect(onValueCommit.mock.calls).toEqual([[3]]);
  });

  test("commits a held arrow key when it is released", () => {
    const onValueCommit = vi.fn<(value: number) => void>();
    const { input } = setup({ initial: 5, onValueCommit, writesBack: true });

    keyDown(input, "ArrowUp");
    keyDown(input, "ArrowUp");
    expect(onValueCommit).not.toHaveBeenCalled();
    input.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowUp" }));
    expect(onValueCommit.mock.calls).toEqual([[7]]);
  });

  test("commits a typed value and an assistive-technology click at once", () => {
    const onValueCommit = vi.fn<(value: number) => void>();
    const { input, increment } = setup({ initial: 3, onValueCommit, writesBack: true });

    type(input, "8");
    increment.dispatchEvent(new MouseEvent("click", { detail: 0 }));
    expect(onValueCommit.mock.calls).toEqual([[8], [9]]);
  });

  test("commits nothing when a gesture ends where it started", () => {
    const onValueCommit = vi.fn<(value: number) => void>();
    const { increment } = setup({ initial: 4, onValueCommit });

    press(increment);
    release(increment);
    expect(onValueCommit).not.toHaveBeenCalled();
  });

  test("disables everything and ignores presses while disabled", () => {
    const { input, decrement, increment, disabled, onValueChange } = setup({ initial: 5 });

    disabled.value = true;
    expect([input.disabled, decrement.disabled, increment.disabled]).toEqual([true, true, true]);
    press(increment);
    press(decrement);
    increment.click();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("ends a held press when it becomes disabled, committing where it got to", () => {
    const onValueCommit = vi.fn<(value: number) => void>();
    const { increment, disabled, scheduler } = setup({ onValueCommit, writesBack: true });

    press(increment);
    disabled.value = true;
    expect(onValueCommit.mock.calls).toEqual([[1]]);
    expect(scheduler.runNext()).toBe(-1);
  });

  test("stops following its value once disposed", () => {
    const { input, value, dispose } = setup({ initial: 3 });

    dispose();
    value.value = 7;
    expect(input.value).toBe("3");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(StepperClass, STEPPER_CSS);
  });
});
