import { Dropdown, DropdownClass, createDropdown } from "@/core/ui/components/dropdown/dropdown";
import { Mock, describe, expect, test, vi } from "vitest";
import DROPDOWN_CSS from "@/core/ui/components/dropdown/dropdown.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

type Sort = "score" | "date" | "random" | "none";

const CHOICES = [
  { value: "score", label: "Score" },
  { value: "date", label: "Date" },
  { value: "random", label: "Random" }
] as const;

interface Setup extends Dropdown {
  value: Signal<Sort>;
  disabled: Signal<boolean>;
  onValueChange: Mock<(next: Sort) => void>;
}

function setup(initial: Sort = "none"): Setup {
  const value = new Signal<Sort>(initial);
  const disabled = new Signal(false);
  const onValueChange = vi.fn<(next: Sort) => void>();
  return { ...createDropdown<Sort>(document, { choices: CHOICES, value, disabled, onValueChange }), value, disabled, onValueChange };
}

function choose(element: HTMLSelectElement, index: number): void {
  element.selectedIndex = index;
  element.dispatchEvent(new Event("change"));
}

describe("createDropdown", () => {
  test("is a native select with one option per choice, choosing nothing while its value is not an option", () => {
    const { element } = setup();

    expect(element.tagName).toBe("SELECT");
    expect([...element.options].map(option => option.textContent)).toEqual(["Score", "Date", "Random"]);
    expect(element.selectedIndex).toBe(-1);
  });

  test("is medium unless told otherwise", () => {
    const value = new Signal("score");

    expect(setup().element.dataset.size).toBe("medium");
    expect(createDropdown(document, { choices: CHOICES, value, onValueChange: vi.fn(), size: "small" }).element.dataset.size).toBe("small");
  });

  test("follows its value", () => {
    const { element, value } = setup();

    value.value = "random";
    expect(element.selectedIndex).toBe(2);
  });

  test("reports the chosen option and goes back to its current value", () => {
    const { element, onValueChange } = setup("score");

    choose(element, 1);
    expect(onValueChange).toHaveBeenLastCalledWith("date");
    expect(element.selectedIndex).toBe(0);
  });

  test("works with values that are not strings", () => {
    const onValueChange = vi.fn();
    const choices = [{ value: 10, label: "Ten" }, { value: 20, label: "Twenty" }];
    const { element } = createDropdown(document, { choices, value: new Signal(10), onValueChange });

    choose(element, 1);
    expect(onValueChange).toHaveBeenLastCalledWith(20);
  });

  test("disables natively", () => {
    const { element, disabled } = setup();

    disabled.value = true;
    expect(element.disabled).toBe(true);
  });

  test("stops following its value once disposed", () => {
    const { element, value, dispose } = setup("score");

    dispose();
    value.value = "random";
    expect(element.selectedIndex).toBe(0);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(DropdownClass, DROPDOWN_CSS);
  });
});
