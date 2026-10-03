import { Dropdown, DropdownClass, createDropdown } from "@/core/ui/components/dropdown/dropdown";
import { Mock, describe, expect, test, vi } from "vitest";
import DROPDOWN_CSS from "@/core/ui/components/dropdown/dropdown.css?inline";
import { expectClassesStyled } from "@/testing/css";

type Sort = "score" | "date" | "random";

const OPTIONS = [
  { value: "score", label: "Score" },
  { value: "date", label: "Date" },
  { value: "random", label: "Random" }
] as const;

function setup(): Dropdown<Sort> & { onValueChange: Mock<(next: Sort) => void> } {
  const onValueChange = vi.fn<(next: Sort) => void>();
  return { ...createDropdown<Sort>(document, { options: OPTIONS, onValueChange }), onValueChange };
}

function choose(element: HTMLSelectElement, index: number): void {
  element.selectedIndex = index;
  element.dispatchEvent(new Event("change"));
}

describe("createDropdown", () => {
  test("is a native select with one option per choice and nothing chosen until told", () => {
    const { element } = setup();

    expect(element.tagName).toBe("SELECT");
    expect([...element.options].map((option) => option.textContent)).toEqual(["Score", "Date", "Random"]);
    expect(element.selectedIndex).toBe(-1);
  });

  test("is medium unless told otherwise", () => {
    expect(setup().element.dataset.size).toBe("medium");
    expect(createDropdown(document, { options: OPTIONS, onValueChange: vi.fn(), size: "small" }).element.dataset.size).toBe("small");
  });

  test("shows what it is told", () => {
    const { element, setValue } = setup();

    setValue("random");
    expect(element.selectedIndex).toBe(2);
  });

  test("reports the chosen option and goes back to the last told one", () => {
    const { element, onValueChange, setValue } = setup();

    setValue("score");
    choose(element, 1);
    expect(onValueChange).toHaveBeenLastCalledWith("date");
    expect(element.selectedIndex).toBe(0);
  });

  test("works with values that are not strings", () => {
    const onValueChange = vi.fn();
    const { element } = createDropdown(document, { options: [{ value: 10, label: "Ten" }, { value: 20, label: "Twenty" }], onValueChange });

    choose(element, 1);
    expect(onValueChange).toHaveBeenLastCalledWith(20);
  });

  test("disables natively", () => {
    const { element, setDisabled } = setup();

    setDisabled(true);
    expect(element.disabled).toBe(true);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(DropdownClass, DROPDOWN_CSS);
  });
});
