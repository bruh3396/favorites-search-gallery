import { ChoiceSetting, ChoicesSetting, NumberSetting, SettingDescriptor, SettingPreference, SwitchSetting } from "@/core/ui/settings/descriptor";
import { Readable, Signal } from "@/core/utils/reactive/signal";
import { Setting, SettingProps } from "@/core/ui/settings/setting";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";

const LAYOUTS = ["column", "row", "square"] as const;
const LAYOUT_LABELS = { column: "Column", row: "Row", square: "Square" };

type Layout = (typeof LAYOUTS)[number];

const SCHEDULER = { schedule: (): (() => void) => () => undefined };

// Records every write, so a test can tell a preview from a write.
function createPreference<T>(initial: T): SettingPreference<T> & { writes: T[] } {
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

function createSwitchSetting(preference: SettingPreference<boolean>, disabled?: Readable<boolean>): SwitchSetting {
  return { id: "autoplay", kind: "switch", label: "Autoplay", preference, disabled };
}

function createLayoutSetting(preference: SettingPreference<Layout>, control: ChoiceSetting["control"]): ChoiceSetting<Layout> {
  return { id: "layout", kind: "choice", label: "Layout", preference, members: LAYOUTS, labels: LAYOUT_LABELS, control };
}

function setup(props: SettingProps): { element: HTMLElement; dispose: () => void } {
  const { result: element, dispose } = render(document, () => <Setting {...props} />);
  return { element, dispose };
}

function renderSetting(descriptor: SettingDescriptor): HTMLElement {
  return setup({ descriptor, scheduler: SCHEDULER }).element;
}

function queryButtons(element: HTMLElement): HTMLButtonElement[] {
  return [...element.querySelectorAll("button")];
}

function press(button: HTMLButtonElement): void {
  button.dispatchEvent(new PointerEvent("pointerdown", { button: 0 }));
}

// A number setting at 1 whose hold repeats only when the test runs the next task.
function setupHeldNumber({ writeOnEveryStep }: { writeOnEveryStep: boolean }): {
  input: HTMLInputElement;
  increment: HTMLButtonElement;
  preference: SettingPreference<number> & { writes: number[] };
  scheduler: { runNext: () => void };
} {
  const preference = createPreference(1);
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
  const descriptor: NumberSetting = { id: "columns", kind: "number", label: "Columns", preference, min: 0, max: 10, step: 1, writeOnEveryStep };
  const { element } = setup({ descriptor, scheduler });
  return { input: element.querySelector("input")!, increment: queryButtons(element)[1], preference, scheduler };
}

describe("Setting", () => {
  test("labels the row and captions it from the descriptor", () => {
    const element = renderSetting({ ...createSwitchSetting(createPreference(false)), description: "Plays videos when opened." });

    expect(element.textContent).toBe("AutoplayPlays videos when opened.");
  });

  test("draws the row and its control at one size", () => {
    const descriptor = createSwitchSetting(createPreference(false));
    const { element } = setup({ descriptor, size: "small", scheduler: SCHEDULER });

    expect([element.dataset.size, queryButtons(element)[0].dataset.size]).toEqual(["small", "small"]);
  });

  test("hides and shows its caption as told", () => {
    const descriptor = { ...createSwitchSetting(createPreference(false)), description: "Plays videos when opened." };
    const descriptionVisible = new Signal(false);
    const { element } = setup({ descriptor, descriptionVisible, scheduler: SCHEDULER });

    expect(element.querySelector<HTMLElement>(".fsg-SettingRow-description")?.hidden).toBe(true);
  });

  test("shows a switch's preference and follows it", () => {
    const preference = createPreference(false);
    const [control] = queryButtons(renderSetting(createSwitchSetting(preference)));

    expect(control.getAttribute("aria-checked")).toBe("false");
    preference.set(true);
    expect(control.getAttribute("aria-checked")).toBe("true");
  });

  test("writes the next value to the preference", () => {
    const preference = createPreference(false);
    const [control] = queryButtons(renderSetting(createSwitchSetting(preference)));

    control.click();
    expect(preference.value).toBe(true);
    expect(control.getAttribute("aria-checked")).toBe("true");
  });

  test("offers a choice's members in order, by their labels, as a segmented control", () => {
    const preference = createPreference<Layout>("row");
    const buttons = queryButtons(renderSetting(createLayoutSetting(preference, "segmented")));

    expect(buttons.map(button => button.textContent)).toEqual(["Column", "Row", "Square"]);
    expect(buttons[1].getAttribute("aria-checked")).toBe("true");
    buttons[2].click();
    expect(preference.value).toBe("square");
  });

  test("offers a choice as a dropdown", () => {
    const preference = createPreference<Layout>("row");
    const select = renderSetting(createLayoutSetting(preference, "dropdown")).querySelector("select");

    expect([...select?.options ?? []].map(option => option.textContent)).toEqual(["Column", "Row", "Square"]);
    expect(select?.selectedIndex).toBe(1);
  });

  test("toggles one of several choices", () => {
    const preference = createPreference<readonly Layout[]>(["column"]);
    const descriptor: ChoicesSetting<Layout> = {
      id: "layouts", kind: "choices", label: "Layouts", preference, members: LAYOUTS, labels: LAYOUT_LABELS
    };
    const buttons = queryButtons(renderSetting(descriptor));

    buttons[2].click();
    expect(preference.value).toEqual(["column", "square"]);
  });

  test("steps a number within its bounds", () => {
    const preference = createPreference(10);
    const descriptor: NumberSetting = { id: "columns", kind: "number", label: "Columns", preference, min: 2, max: 10, step: 1 };
    const element = renderSetting(descriptor);
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

  test("disables the control while its disabled state is true", () => {
    const infiniteScroll = createPreference(true);
    const [control] = queryButtons(renderSetting(createSwitchSetting(createPreference(false), infiniteScroll)));

    expect(control.disabled).toBe(true);
    infiniteScroll.set(false);
    expect(control.disabled).toBe(false);
  });

  test("stops following its preference once disposed", () => {
    const preference = createPreference(false);
    const { element, dispose } = setup({ descriptor: createSwitchSetting(preference), scheduler: SCHEDULER });
    const [control] = queryButtons(element);

    dispose();
    preference.set(true);
    expect(control.getAttribute("aria-checked")).toBe("false");
  });
});
