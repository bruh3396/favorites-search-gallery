import { MultiSelect, MultiSelectClass } from "@/core/ui/components/multi_select/multi_select";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import MULTI_SELECT_CSS from "@/core/ui/components/multi_select/multi_select.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

type Action = "favorite" | "download" | "open";

const CHOICES = [
  { value: "favorite", label: "Favorite" },
  { value: "download", label: "Download" },
  { value: "open", label: "Open" }
] as const;

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  value: Signal<readonly Action[]>;
  disabled: Signal<boolean>;
  onValueChange: (next: readonly Action[]) => void;
  toggles: HTMLButtonElement[];
}

function setup(initial: readonly Action[] = []): Setup {
  const value = new Signal(initial);
  const disabled = new Signal(false);
  const onValueChange = vi.fn();
  const { result: element, dispose } = render(document, () => (
    <MultiSelect<Action> choices={CHOICES} value={value} disabled={disabled} onValueChange={onValueChange} />
  ));
  return { element, dispose, value, disabled, onValueChange, toggles: [...element.querySelectorAll("button")] };
}

function readPressedStates(toggles: HTMLButtonElement[]): boolean[] {
  return toggles.map(toggle => toggle.getAttribute("aria-pressed") === "true");
}

function readLockedStates(toggles: HTMLButtonElement[]): boolean[] {
  return toggles.map(toggle => toggle.getAttribute("aria-disabled") === "true");
}

describe("MultiSelect", () => {
  test("is a group of toggle buttons, one per option, each its own tab stop", () => {
    const { element, toggles } = setup();

    expect(element.getAttribute("role")).toBe("group");
    expect(toggles.map(toggle => toggle.textContent)).toEqual(["Favorite", "Download", "Open"]);
    expect(toggles.every(toggle => toggle.type === "button" && toggle.tabIndex === 0)).toBe(true);
    expect(readPressedStates(toggles)).toEqual([false, false, false]);
  });

  test("is medium unless told otherwise", () => {
    const value = new Signal<readonly string[]>([]);
    const { result } = render(document, () => <MultiSelect<string> choices={CHOICES} value={value} onValueChange={vi.fn()} size="small" />);

    expect(setup().element.dataset.size).toBe("medium");
    expect(result.dataset.size).toBe("small");
  });

  test("follows its value", () => {
    const { toggles, value } = setup();

    value.value = ["open", "favorite"];
    expect(readPressedStates(toggles)).toEqual([true, false, true]);
  });

  test("reports an added option in option order without changing itself", () => {
    const { toggles, onValueChange } = setup(["open"]);

    toggles[0].click();
    expect(onValueChange).toHaveBeenLastCalledWith(["favorite", "open"]);
    expect(readPressedStates(toggles)).toEqual([false, false, true]);
  });

  test("reports a removed option", () => {
    const { toggles, onValueChange } = setup(["favorite", "download"]);

    toggles[1].click();
    expect(onValueChange).toHaveBeenLastCalledWith(["favorite"]);
  });

  test("locks the last pressed option: it reports nothing and says so", () => {
    const { toggles, onValueChange } = setup(["download"]);

    toggles[1].click();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(readLockedStates(toggles)).toEqual([false, true, false]);
    expect(toggles[1].disabled).toBe(false);
  });

  test("unlocks once another option is pressed", () => {
    const { toggles, value } = setup(["download"]);

    value.value = ["download", "open"];
    expect(readLockedStates(toggles)).toEqual([false, false, false]);
  });

  test("disables every option and ignores clicks while disabled", () => {
    const { toggles, disabled, onValueChange } = setup();

    disabled.value = true;
    toggles[0].click();
    expect(toggles.every(toggle => toggle.disabled)).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("stops following its value once disposed", () => {
    const { toggles, value, dispose } = setup(["open"]);

    dispose();
    value.value = ["favorite"];
    expect(readPressedStates(toggles)).toEqual([false, false, true]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(MultiSelectClass, MULTI_SELECT_CSS);
  });
});
