import { ChoiceSetting, ChoicesSetting, NumberSetting, SettingDescriptor, SettingPreference, SwitchSetting } from "@/core/ui/settings/descriptor";
import { describe, expect, test } from "vitest";
import { Signal } from "@/core/utils/reactive/signal";
import { createSetting } from "@/core/ui/settings/setting";

const LAYOUTS = ["column", "row", "square"] as const;
const LAYOUT_LABELS = { column: "Column", row: "Row", square: "Square" };

type Layout = (typeof LAYOUTS)[number];

const SCHEDULER = { schedule: (): (() => void) => () => undefined };

function createPreference<T>(initial: T): SettingPreference<T> & { signal: Signal<T> } {
  const signal = new Signal(initial);
  return {
    signal,
    get value(): T {
      return signal.value;
    },
    set(value: T): void {
      signal.value = value;
    }
  };
}

function createSwitchSetting(preference: SettingPreference<boolean>, enabledWhen?: () => boolean): SwitchSetting {
  return { id: "autoplay", kind: "switch", label: "Autoplay", preference, enabledWhen };
}

function createLayoutSetting(preference: SettingPreference<Layout>, variant: ChoiceSetting["variant"]): ChoiceSetting<Layout> {
  return { id: "layout", kind: "choice", label: "Layout", preference, members: LAYOUTS, labels: LAYOUT_LABELS, variant };
}

function render(descriptor: SettingDescriptor): HTMLDivElement {
  return createSetting(document, { descriptor, scheduler: SCHEDULER }).element;
}

function buttonsOf(element: HTMLElement): HTMLButtonElement[] {
  return [...element.querySelectorAll("button")];
}

function press(button: HTMLButtonElement): void {
  button.dispatchEvent(new PointerEvent("pointerdown", { button: 0 }));
}

// A number setting at 1 whose hold repeats only when the test runs the next task; records every write.
function setupHeldNumber({ live }: { live: boolean }): {
  input: HTMLInputElement;
  increment: HTMLButtonElement;
  preference: SettingPreference<number>;
  writes: number[];
  scheduler: { runNext: () => void };
} {
  const stored = createPreference(1);
  const writes: number[] = [];
  const preference = {
    get value(): number {
      return stored.value;
    },
    set(value: number): void {
      writes.push(value);
      stored.set(value);
    }
  };
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
  const descriptor: NumberSetting = { id: "columns", kind: "number", label: "Columns", preference, min: 0, max: 10, step: 1, live };
  const element = createSetting(document, { descriptor, scheduler }).element;
  return { input: element.querySelector("input")!, increment: buttonsOf(element)[1], preference, writes, scheduler };
}

describe("createSetting", () => {
  test("labels the row and captions it from the descriptor", () => {
    const element = render({ ...createSwitchSetting(createPreference(false)), description: "Plays videos when opened." });

    expect(element.textContent).toBe("AutoplayPlays videos when opened.");
  });

  test("shows a switch's preference and follows it", () => {
    const preference = createPreference(false);
    const [control] = buttonsOf(render(createSwitchSetting(preference)));

    expect(control.getAttribute("aria-checked")).toBe("false");
    preference.set(true);
    expect(control.getAttribute("aria-checked")).toBe("true");
  });

  test("writes the next value to the preference", () => {
    const preference = createPreference(false);
    const [control] = buttonsOf(render(createSwitchSetting(preference)));

    control.click();
    expect(preference.value).toBe(true);
    expect(control.getAttribute("aria-checked")).toBe("true");
  });

  test("offers a choice's members in order, by their labels, as a segmented control", () => {
    const preference = createPreference<Layout>("row");
    const buttons = buttonsOf(render(createLayoutSetting(preference, "segmented")));

    expect(buttons.map((button) => button.textContent)).toEqual(["Column", "Row", "Square"]);
    expect(buttons[1].getAttribute("aria-checked")).toBe("true");
    buttons[2].click();
    expect(preference.value).toBe("square");
  });

  test("offers a choice as a dropdown", () => {
    const preference = createPreference<Layout>("row");
    const select = render(createLayoutSetting(preference, "dropdown")).querySelector("select");

    expect([...select?.options ?? []].map((option) => option.textContent)).toEqual(["Column", "Row", "Square"]);
    expect(select?.selectedIndex).toBe(1);
  });

  test("toggles one of several choices", () => {
    const preference = createPreference<readonly Layout[]>(["column"]);
    const descriptor: ChoicesSetting<Layout> = {
      id: "layouts", kind: "choices", label: "Layouts", preference, members: LAYOUTS, labels: LAYOUT_LABELS
    };
    const buttons = buttonsOf(render(descriptor));

    buttons[2].click();
    expect(preference.value).toEqual(["column", "square"]);
  });

  test("steps a number within its bounds", () => {
    const preference = createPreference(10);
    const descriptor: NumberSetting = { id: "columns", kind: "number", label: "Columns", preference, min: 2, max: 10, step: 1 };
    const element = render(descriptor);
    const input = element.querySelector("input");

    expect(input?.value).toBe("10");
    expect(input?.getAttribute("aria-label")).toBe("Columns");
    expect(buttonsOf(element)[1].disabled).toBe(true);
  });

  test("previews a held number and writes it once, on release", () => {
    const { input, increment, preference, writes, scheduler } = setupHeldNumber({ live: false });

    press(increment);
    scheduler.runNext();
    expect([input.value, preference.value]).toEqual(["3", 1]);
    increment.dispatchEvent(new PointerEvent("pointerup"));
    expect([input.value, writes]).toEqual(["3", [3]]);
  });

  test("writes every step of a live number", () => {
    const { increment, writes, scheduler } = setupHeldNumber({ live: true });

    press(increment);
    scheduler.runNext();
    increment.dispatchEvent(new PointerEvent("pointerup"));
    expect(writes).toEqual([2, 3]);
  });

  test("disables the control while enabledWhen is false, and follows the signals it reads", () => {
    const infiniteScroll = createPreference(true);
    const [control] = buttonsOf(render(createSwitchSetting(createPreference(false), () => !infiniteScroll.value)));

    expect(control.disabled).toBe(true);
    infiniteScroll.set(false);
    expect(control.disabled).toBe(false);
  });

  test("stops following its preference once disposed", () => {
    const preference = createPreference(false);
    const setting = createSetting(document, { descriptor: createSwitchSetting(preference), scheduler: SCHEDULER });
    const [control] = buttonsOf(setting.element);

    setting.dispose();
    preference.set(true);
    expect(control.getAttribute("aria-checked")).toBe("false");
  });
});
