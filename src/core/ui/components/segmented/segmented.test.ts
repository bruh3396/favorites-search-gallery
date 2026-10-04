import { Segmented, SegmentedClass, createSegmented } from "@/core/ui/components/segmented/segmented";
import { afterEach, describe, expect, test, vi } from "vitest";
import SEGMENTED_CSS from "@/core/ui/components/segmented/segmented.css?inline";
import { expectClassesStyled } from "@/testing/css";

type Layout = "column" | "row" | "square";

const OPTIONS = [
  { value: "column", label: "Column" },
  { value: "row", label: "Row" },
  { value: "square", label: "Square" }
] as const;

function setup(): Segmented<Layout> & { onValueChange: (next: Layout) => void; radios: HTMLButtonElement[] } {
  const onValueChange = vi.fn();
  const segmented = createSegmented<Layout>(document, { options: OPTIONS, onValueChange });

  document.body.append(segmented.element);
  return { ...segmented, onValueChange, radios: [...segmented.element.querySelectorAll<HTMLButtonElement>("[role=radio]")] };
}

function press(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });

  target.dispatchEvent(event);
  return event;
}

function readCheckedStates(radios: HTMLButtonElement[]): boolean[] {
  return radios.map(radio => radio.getAttribute("aria-checked") === "true");
}

function readTabIndexes(radios: HTMLButtonElement[]): number[] {
  return radios.map(radio => radio.tabIndex);
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("createSegmented", () => {
  test("is a radio group with one radio button per option", () => {
    const { element, radios } = setup();

    expect(element.getAttribute("role")).toBe("radiogroup");
    expect(radios.map(radio => radio.textContent)).toEqual(["Column", "Row", "Square"]);
    expect(radios.every(radio => radio.type === "button")).toBe(true);
  });

  test("starts with nothing checked and the first option as the tab stop", () => {
    const { radios } = setup();

    expect(readCheckedStates(radios)).toEqual([false, false, false]);
    expect(readTabIndexes(radios)).toEqual([0, -1, -1]);
  });

  test("is medium unless told otherwise", () => {
    expect(setup().element.dataset.size).toBe("medium");
    expect(createSegmented(document, { options: OPTIONS, onValueChange: vi.fn(), size: "small" }).element.dataset.size).toBe("small");
  });

  test("shows what it is told and makes only the checked option a tab stop", () => {
    const { radios, setValue } = setup();

    setValue("row");
    expect(readCheckedStates(radios)).toEqual([false, true, false]);
    expect(readTabIndexes(radios)).toEqual([-1, 0, -1]);
  });

  test("reports a clicked option without changing itself", () => {
    const { radios, onValueChange, setValue } = setup();

    setValue("column");
    radios[2].click();
    expect(onValueChange).toHaveBeenLastCalledWith("square");
    expect(readCheckedStates(radios)).toEqual([true, false, false]);
  });

  test("does not report the option that is already checked", () => {
    const { radios, onValueChange, setValue } = setup();

    setValue("row");
    radios[1].click();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test.each([
    ["ArrowRight", "row", 2],
    ["ArrowDown", "row", 2],
    ["ArrowLeft", "row", 0],
    ["ArrowUp", "row", 0],
    ["ArrowRight", "square", 0],
    ["ArrowLeft", "column", 2],
    ["Home", "square", 0],
    ["End", "column", 2]
  ] as const)("%s from %s focuses and reports option %i", (key, from, to) => {
    const { radios, onValueChange, setValue } = setup();
    const index = OPTIONS.findIndex(option => option.value === from);

    setValue(from);
    radios[index].focus();
    expect(press(radios[index], key).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(radios[to]);
    expect(onValueChange).toHaveBeenLastCalledWith(OPTIONS[to].value);
  });

  test("ignores other keys", () => {
    const { radios, onValueChange } = setup();

    expect(press(radios[0], "Enter").defaultPrevented).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("disables every option and ignores clicks while disabled", () => {
    const { radios, onValueChange, setDisabled } = setup();

    setDisabled(true);
    radios[1].click();
    expect(radios.every(radio => radio.disabled)).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SegmentedClass, SEGMENTED_CSS);
  });
});
