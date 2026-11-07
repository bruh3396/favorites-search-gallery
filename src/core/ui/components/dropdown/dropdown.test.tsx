import { Dropdown, DropdownClass } from "@/core/ui/components/dropdown/dropdown";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import DROPDOWN_CSS from "@/core/ui/components/dropdown/dropdown.css?inline";
import { OptionMenuClass } from "@/core/ui/components/option_menu/option_menu";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

type Sort = "score" | "date" | "random" | "none";

const CHOICES = [
  { value: "score", label: "Score" },
  { value: "date", label: "Date" },
  { value: "random", label: "Random" }
] as const;

interface Setup {
  trigger: HTMLButtonElement;
  dispose: () => void;
  value: Signal<Sort>;
  disabled: Signal<boolean>;
  onValueChange: Mock<(sort: Sort) => void>;
  onPreview: Mock<(previewed: Sort | null) => void>;
}

function setup(initialSort: Sort = "score"): Setup {
  const value = new Signal<Sort>(initialSort);
  const disabled = new Signal(false);
  const onValueChange = vi.fn<(nextSort: Sort) => void>();
  const onPreview = vi.fn<(previewed: Sort | null) => void>();
  const { result, dispose } = render(document, () => (
    <Dropdown<Sort> controlChoices={CHOICES} value={value} disabled={disabled} onValueChange={onValueChange} onPreview={onPreview} />
  ));
  const container = document.createElement("div");

  container.append(result);
  document.body.append(container);
  onTestFinished(() => {
    dispose();
    container.remove();
  });
  return { trigger: result as HTMLButtonElement, dispose, value, disabled, onValueChange, onPreview };
}

function queryMenu(): HTMLElement | null {
  return document.querySelector(`.${OptionMenuClass.root}`);
}

function queryOptions(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(`.${OptionMenuClass.option}`)];
}

function press(trigger: HTMLElement, key: string): void {
  trigger.dispatchEvent(new KeyboardEvent("keydown", { key, cancelable: true }));
}

describe("Dropdown", () => {
  test("shows the chosen label on a closed combobox", () => {
    const { trigger } = setup("date");

    expect([trigger.role, trigger.textContent, trigger.getAttribute("aria-expanded")]).toEqual(["combobox", "Date", "false"]);
    expect(queryMenu()).toBeNull();
  });

  test("defaults to medium unless given a size", () => {
    const { result } = render(document, () => <Dropdown<string> controlChoices={CHOICES} value={new Signal("score")} onValueChange={vi.fn()} size="small" />);

    expect(setup().trigger.dataset.size).toBe("medium");
    expect(result.dataset.size).toBe("small");
  });

  test("follows its value", () => {
    const { trigger, value } = setup();

    value.value = "random";
    expect(trigger.textContent).toBe("Random");
  });

  test("opens a menu of every choice, marking the chosen one", () => {
    const { trigger } = setup("date");

    trigger.click();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(queryOptions().map(option => [option.textContent, option.getAttribute("aria-selected")]))
      .toEqual([["Score", "false"], ["Date", "true"], ["Random", "false"]]);
  });

  test("reports the clicked option and closes", () => {
    const { trigger, onValueChange } = setup();

    trigger.click();
    queryOptions()[2].click();
    expect(onValueChange).toHaveBeenLastCalledWith("random");
    expect(queryMenu()).toBeNull();
  });

  test("closes without reporting when the chosen option is clicked again", () => {
    const { trigger, onValueChange } = setup();

    trigger.click();
    queryOptions()[0].click();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("previews the hovered option and clears the preview when the pointer leaves", () => {
    const { trigger, onPreview } = setup();

    trigger.click();
    queryOptions()[1].dispatchEvent(new PointerEvent("pointermove"));
    queryMenu()!.dispatchEvent(new PointerEvent("pointerleave"));
    expect(onPreview.mock.calls).toEqual([["score"], ["date"], [null]]);
  });

  test("previews with the arrow keys and chooses with Enter", () => {
    const { trigger, onPreview, onValueChange } = setup();

    press(trigger, "ArrowDown");
    press(trigger, "ArrowDown");
    press(trigger, "ArrowDown");
    expect(onPreview.mock.calls).toEqual([["score"], ["date"], ["random"]]);
    expect(trigger.ariaActiveDescendantElement).toBe(queryOptions()[2]);
    press(trigger, "Enter");
    expect(onValueChange).toHaveBeenLastCalledWith("random");
    expect(onPreview).toHaveBeenLastCalledWith(null);
  });

  test("closes on Escape without choosing", () => {
    const { trigger, onValueChange, onPreview } = setup();

    trigger.click();
    press(trigger, "End");
    press(trigger, "Escape");
    expect(queryMenu()).toBeNull();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onPreview).toHaveBeenLastCalledWith(null);
  });

  test("closes when pressed outside", () => {
    const { trigger } = setup();

    trigger.click();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  test("shows no label for a value among no choices", () => {
    expect(setup("none").trigger.textContent).toBe("");
  });

  test("previews a hovered option once while the pointer stays on it", () => {
    const { trigger, onPreview } = setup();

    trigger.click();
    queryOptions()[1].dispatchEvent(new PointerEvent("pointermove"));
    queryOptions()[1].dispatchEvent(new PointerEvent("pointermove"));
    expect(onPreview.mock.calls).toEqual([["score"], ["date"]]);
  });

  test("stays open when pressed on itself", () => {
    const { trigger } = setup();

    trigger.click();
    queryOptions()[1].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  test("ignores other keys", () => {
    const { trigger, onValueChange } = setup();

    press(trigger, "a");
    const wasOpened = queryMenu() !== null;

    trigger.click();
    press(trigger, "a");
    expect([wasOpened, queryMenu() !== null, onValueChange.mock.calls]).toEqual([false, true, []]);
  });

  test("steps from the chosen option once the pointer has left the menu", () => {
    const { trigger, onPreview } = setup("date");

    trigger.click();
    queryMenu()!.dispatchEvent(new PointerEvent("pointerleave"));
    press(trigger, "ArrowDown");
    expect(onPreview).toHaveBeenLastCalledWith("random");
  });

  test("closes on Tab without choosing", () => {
    const { trigger, onValueChange } = setup();

    trigger.click();
    press(trigger, "ArrowDown");
    press(trigger, "Tab");
    expect([queryMenu(), onValueChange.mock.calls]).toEqual([null, []]);
  });

  test("opens upward when there is more room above than below", () => {
    const { trigger } = setup();

    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue(new DOMRect(10, 700, 100, 30));
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(768);
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(200);
    onTestFinished(() => {
      vi.restoreAllMocks();
    });
    trigger.click();
    const { top, bottom, maxBlockSize } = queryMenu()!.style;

    expect([top, bottom, maxBlockSize]).toEqual(["", "72px", "692px"]);
  });

  test("works with values that are not strings", () => {
    const onValueChange = vi.fn();
    const choices = [{ value: 10, label: "Ten" }, { value: 20, label: "Twenty" }];
    const { result } = render(document, () => <Dropdown controlChoices={choices} value={new Signal(10)} onValueChange={onValueChange} />);

    press(result, "ArrowDown");
    press(result, "ArrowDown");
    press(result, "Enter");
    expect(onValueChange).toHaveBeenLastCalledWith(20);
  });

  test("disables natively", () => {
    const { trigger, disabled } = setup();

    disabled.value = true;
    expect(trigger.disabled).toBe(true);
  });

  test("stops following its value once disposed", () => {
    const { trigger, value, dispose } = setup();

    dispose();
    value.value = "random";
    expect(trigger.textContent).toBe("Score");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(DropdownClass, DROPDOWN_CSS);
  });
});
