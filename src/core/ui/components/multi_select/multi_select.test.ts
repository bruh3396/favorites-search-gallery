import { MultiSelect, MultiSelectClass, createMultiSelect } from "@/core/ui/components/multi_select/multi_select";
import { describe, expect, test, vi } from "vitest";
import MULTI_SELECT_CSS from "@/core/ui/components/multi_select/multi_select.css?inline";
import { expectClassesStyled } from "@/testing/css";

type Action = "favorite" | "download" | "open";

const OPTIONS = [
  { value: "favorite", label: "Favorite" },
  { value: "download", label: "Download" },
  { value: "open", label: "Open" }
] as const;

function setup(): MultiSelect<Action> & { onValueChange: (next: readonly Action[]) => void; toggles: HTMLButtonElement[] } {
  const onValueChange = vi.fn();
  const multiSelect = createMultiSelect<Action>(document, { options: OPTIONS, onValueChange });
  return { ...multiSelect, onValueChange, toggles: [...multiSelect.element.querySelectorAll("button")] };
}

function pressedOf(toggles: HTMLButtonElement[]): boolean[] {
  return toggles.map((toggle) => toggle.getAttribute("aria-pressed") === "true");
}

function lockedOf(toggles: HTMLButtonElement[]): boolean[] {
  return toggles.map((toggle) => toggle.getAttribute("aria-disabled") === "true");
}

describe("createMultiSelect", () => {
  test("is a group of toggle buttons, one per option, each its own tab stop", () => {
    const { element, toggles } = setup();

    expect(element.getAttribute("role")).toBe("group");
    expect(toggles.map((toggle) => toggle.textContent)).toEqual(["Favorite", "Download", "Open"]);
    expect(toggles.every((toggle) => toggle.type === "button" && toggle.tabIndex === 0)).toBe(true);
    expect(pressedOf(toggles)).toEqual([false, false, false]);
  });

  test("is medium unless told otherwise", () => {
    expect(setup().element.dataset.size).toBe("medium");
    expect(createMultiSelect(document, { options: OPTIONS, onValueChange: vi.fn(), size: "small" }).element.dataset.size).toBe("small");
  });

  test("shows what it is told", () => {
    const { toggles, setValue } = setup();

    setValue(["open", "favorite"]);
    expect(pressedOf(toggles)).toEqual([true, false, true]);
  });

  test("reports an added option in option order without changing itself", () => {
    const { toggles, onValueChange, setValue } = setup();

    setValue(["open"]);
    toggles[0].click();
    expect(onValueChange).toHaveBeenLastCalledWith(["favorite", "open"]);
    expect(pressedOf(toggles)).toEqual([false, false, true]);
  });

  test("reports a removed option", () => {
    const { toggles, onValueChange, setValue } = setup();

    setValue(["favorite", "download"]);
    toggles[1].click();
    expect(onValueChange).toHaveBeenLastCalledWith(["favorite"]);
  });

  test("locks the last pressed option: it reports nothing and says so", () => {
    const { toggles, onValueChange, setValue } = setup();

    setValue(["download"]);
    toggles[1].click();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(lockedOf(toggles)).toEqual([false, true, false]);
    expect(toggles[1].disabled).toBe(false);
  });

  test("unlocks once another option is pressed", () => {
    const { toggles, setValue } = setup();

    setValue(["download"]);
    setValue(["download", "open"]);
    expect(lockedOf(toggles)).toEqual([false, false, false]);
  });

  test("disables every option and ignores clicks while disabled", () => {
    const { toggles, onValueChange, setDisabled } = setup();

    setDisabled(true);
    toggles[0].click();
    expect(toggles.every((toggle) => toggle.disabled)).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("styles every class it sets", () => {
    expectClassesStyled(MultiSelectClass, MULTI_SELECT_CSS);
  });
});
