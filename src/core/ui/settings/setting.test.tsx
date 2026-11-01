import { ChoiceSettingDescriptor, ChoicesSettingDescriptor, NumberSettingDescriptor, SettingDescriptor, SliderSettingDescriptor, SwitchSettingDescriptor } from "@/core/ui/settings/setting_descriptor";
import { SettingPreference } from "@/core/ui/settings/setting_preference";
import { Readable, Signal } from "@/core/utils/reactive/signal";
import { Setting, SettingProps } from "@/core/ui/settings/setting";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";

const LAYOUTS = ["column", "row", "square"] as const;
const LAYOUT_LABELS = { column: "Column", row: "Row", square: "Square" };

type Layout = (typeof LAYOUTS)[number];

const SCHEDULER = { schedule: (): (() => void) => () => undefined };

function createStoredValue<T>(initial: T): SettingPreference<T> & { writes: T[] } {
  const signal = new Signal(initial);
  const writes: T[] = [];
  return {
    writes,
    get value(): T {
      return signal.value;
    },
    peek: (): T => signal.peek(),
    set(value: T): void {
      writes.push(value);
      signal.value = value;
    }
  };
}

function createSwitchSetting(settingPreference: SettingPreference<boolean>, disabled?: Readable<boolean>): SwitchSettingDescriptor {
  return { id: "autoplay", kind: "switch", label: "Autoplay", settingPreference, disabled };
}

function createLayoutSetting(settingPreference: SettingPreference<Layout>, control: ChoiceSettingDescriptor["control"]): ChoiceSettingDescriptor<Layout> {
  return { id: "layout", kind: "choice", label: "Layout", settingPreference, members: LAYOUTS, labels: LAYOUT_LABELS, control };
}

function createSizeSetting(settingPreference: SettingPreference<number>, inverted?: boolean): SliderSettingDescriptor {
  return { id: "size", kind: "slider", label: "Size", settingPreference, min: 1, max: 20, step: 1, inverted };
}

function slide(input: HTMLInputElement, to: number): void {
  input.value = String(to);
  input.dispatchEvent(new Event("input"));
}

function setup(settingProps: SettingProps): { element: HTMLElement; dispose: () => void } {
  const { result: element, dispose } = render(document, () => <Setting {...settingProps} />);
  return { element, dispose };
}

function renderSetting(settingDescriptor: SettingDescriptor): HTMLElement {
  return setup({ descriptor: settingDescriptor, stepperScheduler: SCHEDULER }).element;
}

function queryButtons(element: HTMLElement): HTMLButtonElement[] {
  return [...element.querySelectorAll("button")];
}

function press(button: HTMLButtonElement): void {
  button.dispatchEvent(new PointerEvent("pointerdown", { button: 0 }));
}

function setupHeldNumber({ writeOnEveryStep }: { writeOnEveryStep: boolean }): {
  input: HTMLInputElement;
  increment: HTMLButtonElement;
  preference: SettingPreference<number> & { writes: number[] };
  scheduler: { runNext: () => void };
} {
  const preference = createStoredValue(1);
  let pending = (): void => undefined;
  const scheduler = {
    schedule: (task: () => void): (() => void) => {
      pending = task;
      return () => {
        pending = (): void => undefined;
      };
    },
    runNext: (): void => pending()
  };
  const numberSettingDescriptor: NumberSettingDescriptor = { id: "columns", kind: "number", label: "Columns", settingPreference: preference, min: 0, max: 10, step: 1, writeOnEveryStep };
  const { element } = setup({ descriptor: numberSettingDescriptor, stepperScheduler: scheduler });
  return { input: element.querySelector("input")!, increment: queryButtons(element)[1], preference, scheduler };
}

describe("Setting", () => {
  test("refuses a descriptor of an unknown kind", () => {
    const settingDescriptor = { ...createSwitchSetting(createStoredValue(false)), kind: "color" } as unknown as SettingDescriptor;

    expect(() => renderSetting(settingDescriptor)).toThrow("Unexpected value");
  });

  test("labels the row and captions it from the descriptor", () => {
    const element = renderSetting({ ...createSwitchSetting(createStoredValue(false)), description: "Plays videos when opened." });

    expect(element.textContent).toBe("AutoplayPlays videos when opened.");
  });

  test("draws the row and its control at one size", () => {
    const switchSettingDescriptor = createSwitchSetting(createStoredValue(false));
    const { element } = setup({ descriptor: switchSettingDescriptor, controlSize: "small", stepperScheduler: SCHEDULER });

    expect([element.dataset.size, queryButtons(element)[0].dataset.size]).toEqual(["small", "small"]);
  });

  test("hides and shows its caption as told", () => {
    const descriptor = { ...createSwitchSetting(createStoredValue(false)), description: "Plays videos when opened." };
    const descriptionVisible = new Signal(false);
    const { element } = setup({ descriptor, descriptionVisible, stepperScheduler: SCHEDULER });

    expect(element.querySelector<HTMLElement>(".fsg-SettingRow-description")?.hidden).toBe(true);
  });

  test("shows a switch's preference and follows it", () => {
    const preference = createStoredValue(false);
    const [control] = queryButtons(renderSetting(createSwitchSetting(preference)));

    expect(control.getAttribute("aria-checked")).toBe("false");
    preference.set(true);
    expect(control.getAttribute("aria-checked")).toBe("true");
  });

  test("writes the next value to the preference", () => {
    const preference = createStoredValue(false);
    const [control] = queryButtons(renderSetting(createSwitchSetting(preference)));

    control.click();
    expect(preference.value).toBe(true);
    expect(control.getAttribute("aria-checked")).toBe("true");
  });

  test("offers a choice's members in order, by their labels, as a segmented control", () => {
    const preference = createStoredValue<Layout>("row");
    const buttons = queryButtons(renderSetting(createLayoutSetting(preference, "segmented")));

    expect(buttons.map(button => button.textContent)).toEqual(["Column", "Row", "Square"]);
    expect(buttons[1].getAttribute("aria-checked")).toBe("true");
    buttons[2].click();
    expect(preference.value).toBe("square");
  });

  test("offers a choice as a dropdown", () => {
    const preference = createStoredValue<Layout>("row");
    const element = renderSetting(createLayoutSetting(preference, "dropdown"));
    const dropdown = element.querySelector<HTMLElement>("[role=\"combobox\"]")!;

    expect(dropdown.textContent).toBe("Row");
    dropdown.click();
    expect([...element.querySelectorAll("[role=\"option\"]")].map(option => option.textContent)).toEqual(["Column", "Row", "Square"]);
    dropdown.click();
  });

  test("passes a dropdown's previews through", () => {
    const previewed: (string | null)[] = [];
    const choiceSettingDescriptor: ChoiceSettingDescriptor<Layout> = {
      ...createLayoutSetting(createStoredValue<Layout>("row"), "dropdown"),
      onPreview: member => previewed.push(member)
    };
    const dropdown = renderSetting(choiceSettingDescriptor).querySelector<HTMLElement>("[role=\"combobox\"]")!;

    dropdown.click();
    dropdown.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    dropdown.click();
    expect(previewed).toEqual(["row", "square", null]);
  });

  test("switches a switch when its row is clicked", () => {
    const preference = createStoredValue(false);
    const element = renderSetting(createSwitchSetting(preference));

    element.click();
    expect(preference.value).toBe(true);
  });

  test("leaves a disabled switch alone when its row is clicked", () => {
    const preference = createStoredValue(false);
    const element = renderSetting(createSwitchSetting(preference, createStoredValue(true)));

    element.click();
    expect(preference.value).toBe(false);
  });

  test("opens a dropdown's menu when its row is clicked", () => {
    const element = renderSetting(createLayoutSetting(createStoredValue<Layout>("row"), "dropdown"));
    const dropdown = element.querySelector<HTMLElement>("[role=\"combobox\"]")!;

    element.click();
    expect(dropdown.getAttribute("aria-expanded")).toBe("true");
    dropdown.click();
  });

  test("closes a dropdown's menu when an option is chosen", () => {
    const preference = createStoredValue<Layout>("row");
    const element = renderSetting(createLayoutSetting(preference, "dropdown"));
    const dropdown = element.querySelector<HTMLElement>("[role=\"combobox\"]")!;

    dropdown.click();
    element.querySelectorAll<HTMLElement>("[role=\"option\"]")[2].click();
    expect(preference.value).toBe("square");
    expect(dropdown.getAttribute("aria-expanded")).toBe("false");
  });

  test("leaves a segmented choice alone when its row is clicked", () => {
    const preference = createStoredValue<Layout>("row");
    const element = renderSetting(createLayoutSetting(preference, "segmented"));

    element.click();
    expect(preference.writes).toEqual([]);
  });

  test("toggles one of several choices", () => {
    const preference = createStoredValue<readonly Layout[]>(["column"]);
    const choicesSettingDescriptor: ChoicesSettingDescriptor<Layout> = {
      id: "layouts", kind: "choices", label: "Layouts", settingPreference: preference, members: LAYOUTS, labels: LAYOUT_LABELS
    };
    const buttons = queryButtons(renderSetting(choicesSettingDescriptor));

    buttons[2].click();
    expect(preference.value).toEqual(["column", "square"]);
  });

  test("steps a number within its bounds", () => {
    const preference = createStoredValue(10);
    const numberSettingDescriptor: NumberSettingDescriptor = { id: "columns", kind: "number", label: "Columns", settingPreference: preference, min: 2, max: 10, step: 1 };
    const element = renderSetting(numberSettingDescriptor);
    const input = element.querySelector("input");

    expect(input?.value).toBe("10");
    expect(input?.getAttribute("aria-label")).toBe("Columns");
    expect(queryButtons(element)[1].disabled).toBe(true);
  });

  test("previews a held number and writes it once, on release", () => {
    const { input, increment, preference, scheduler } = setupHeldNumber({ writeOnEveryStep: false });

    press(increment);
    scheduler.runNext();
    expect([input.value, preference.value]).toEqual(["3", 1]);
    increment.dispatchEvent(new PointerEvent("pointerup"));
    expect([input.value, preference.writes]).toEqual(["3", [3]]);
  });

  test("shows a number's preference when it changes elsewhere", () => {
    const { input, preference } = setupHeldNumber({ writeOnEveryStep: false });

    preference.set(7);
    expect(input.value).toBe("7");
  });

  test("writes every step of a number that writes on every step", () => {
    const { increment, preference, scheduler } = setupHeldNumber({ writeOnEveryStep: true });

    press(increment);
    scheduler.runNext();
    increment.dispatchEvent(new PointerEvent("pointerup"));
    expect(preference.writes).toEqual([2, 3]);
  });

  test("writes every value a slider passes while dragging", () => {
    const preference = createStoredValue(5);
    const input = renderSetting(createSizeSetting(preference)).querySelector("input")!;

    expect([input.getAttribute("aria-label"), input.value]).toEqual(["Size", "5"]);
    slide(input, 6);
    slide(input, 7);
    expect(preference.writes).toEqual([6, 7]);
  });

  test("runs an inverted slider from its max to its min", () => {
    const preference = createStoredValue(6);
    const input = renderSetting(createSizeSetting(preference, true)).querySelector("input")!;

    expect(input.value).toBe("15");
    slide(input, 20);
    expect(preference.value).toBe(1);
    preference.set(20);
    expect(input.value).toBe("1");
  });

  test("disables the control while its disabled state is true", () => {
    const infiniteScroll = createStoredValue(true);
    const [control] = queryButtons(renderSetting(createSwitchSetting(createStoredValue(false), infiniteScroll)));

    expect(control.disabled).toBe(true);
    infiniteScroll.set(false);
    expect(control.disabled).toBe(false);
  });

  test("stops following its preference once disposed", () => {
    const preference = createStoredValue(false);
    const { element, dispose } = setup({ descriptor: createSwitchSetting(preference), stepperScheduler: SCHEDULER });
    const [control] = queryButtons(element);

    dispose();
    preference.set(true);
    expect(control.getAttribute("aria-checked")).toBe("false");
  });
});
