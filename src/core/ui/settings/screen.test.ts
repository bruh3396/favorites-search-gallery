import { SettingPreference, SwitchSetting } from "@/core/ui/settings/descriptor";
import { SettingsLayout, SettingsScreen, SettingsScreenClass, SettingsScreenOptions, createSettingsScreen } from "@/core/ui/settings/screen";
import { describe, expect, test } from "vitest";
import SCREEN_CSS from "@/core/ui/settings/screen.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

const SCHEDULER = { schedule: (): (() => void) => () => undefined };

const LAYOUT: SettingsLayout = [
  { id: "general", title: "General", settings: ["hints", "autoplay"] },
  { id: "empty", title: "Empty", settings: [] },
  { id: "gallery", title: "Gallery", settings: ["loop"] }
];

function createPreference<T>(initial: T): SettingPreference<T> {
  const signal = new Signal(initial);
  return {
    get value(): T {
      return signal.value;
    },
    peek: (): T => signal.peek(),
    set(value: T): void {
      signal.value = value;
    }
  };
}

function createSwitchSetting(id: string, preference = createPreference(false)): SwitchSetting {
  return { id, kind: "switch", label: id, preference };
}

interface Setup extends SettingsScreen {
  expanded: SettingPreference<readonly string[]>;
  query: Signal<string>;
  triggers: HTMLButtonElement[];
}

function setup(options: Partial<SettingsScreenOptions> = {}): Setup {
  const expanded = options.expanded ?? createPreference<readonly string[]>([]);
  const query = new Signal("");
  const descriptors = ["autoplay", "hints", "loop"].map(id => createSwitchSetting(id));
  const screen = createSettingsScreen(document, { layout: LAYOUT, descriptors, expanded, query, scheduler: SCHEDULER, ...options });
  return { ...screen, expanded, query, triggers: [...screen.element.querySelectorAll<HTMLButtonElement>("[aria-expanded]")] };
}

function readLabels(element: HTMLElement): string[] {
  return [...element.querySelectorAll(".fsg-SettingRow-label")].map(label => label.textContent ?? "");
}

function readVisibleLabels(element: HTMLElement): string[] {
  return [...element.querySelectorAll<HTMLElement>(".fsg-SettingRow")]
    .filter(row => !row.hidden)
    .map(row => row.querySelector(".fsg-SettingRow-label")?.textContent ?? "");
}

function readSectionHiddenStates(triggers: HTMLButtonElement[]): (boolean | undefined)[] {
  return triggers.map(trigger => trigger.closest<HTMLElement>(".fsg-Disclosure")?.hidden);
}

function readExpandedStates(triggers: HTMLButtonElement[]): (string | null)[] {
  return triggers.map(trigger => trigger.getAttribute("aria-expanded"));
}

describe("createSettingsScreen", () => {
  test("draws each section in layout order, its rows in the order it lists them", () => {
    const { triggers, element } = setup();

    expect(triggers.map(trigger => trigger.textContent)).toEqual(["General", "Gallery"]);
    expect(readLabels(element)).toEqual(["hints", "autoplay", "loop"]);
  });

  test("leaves out a section with no settings", () => {
    const { element } = setup();

    expect(element.textContent).not.toContain("Empty");
  });

  test("refuses a layout that names a setting with no descriptor", () => {
    expect(() => setup({ layout: [{ id: "general", title: "General", settings: ["missing"] }] })).toThrow("\"missing\"");
  });

  test("opens the sections the preference lists, and follows it", () => {
    const { triggers, expanded } = setup({ expanded: createPreference<readonly string[]>(["gallery"]) });

    expect(readExpandedStates(triggers)).toEqual(["false", "true"]);
    expanded.set(["general"]);
    expect(readExpandedStates(triggers)).toEqual(["true", "false"]);
  });

  test("writes a section's id into or out of the preference when it is toggled, keeping the others", () => {
    const { triggers, expanded } = setup({ expanded: createPreference<readonly string[]>(["gallery"]) });

    triggers[0].click();
    expect(expanded.value).toEqual(["gallery", "general"]);
    triggers[1].click();
    expect(expanded.value).toEqual(["general"]);
  });

  test("draws sections and rows at the host's size", () => {
    const { element } = setup({ size: "small" });
    const sizes = [...element.querySelectorAll<HTMLElement>("[data-size]")].map(sized => sized.dataset.size);

    expect(new Set(sizes)).toEqual(new Set(["small"]));
  });

  test("hides and shows every caption as told", () => {
    const descriptors = ["autoplay", "hints", "loop"].map(id => ({ ...createSwitchSetting(id), description: `About ${id}.` }));
    const descriptionsVisible = new Signal(false);
    const { element } = setup({ descriptors, descriptionsVisible });
    const captions = [...element.querySelectorAll<HTMLElement>(".fsg-SettingRow-description")];
    const readDescriptionHiddenStates = (): boolean[] => captions.map(caption => caption.hidden);

    expect(readDescriptionHiddenStates()).toEqual([true, true, true]);
    descriptionsVisible.value = true;
    expect(readDescriptionHiddenStates()).toEqual([false, false, false]);
  });

  test("shows only the rows a query matches, and only the sections holding one", () => {
    const { element, triggers, query } = setup();

    query.value = "hints";
    expect(readVisibleLabels(element)).toEqual(["hints"]);
    expect(readSectionHiddenStates(triggers)).toEqual([false, true]);
  });

  test("shows every row again when the query is cleared", () => {
    const { element, triggers, query } = setup();

    query.value = "loop";
    query.value = "  ";
    expect(readVisibleLabels(element)).toEqual(["hints", "autoplay", "loop"]);
    expect(readSectionHiddenStates(triggers)).toEqual([false, false]);
  });

  test("opens every section while searching, then restores the saved open sections", () => {
    const { triggers, query } = setup({ expanded: createPreference<readonly string[]>(["gallery"]) });

    query.value = "o";
    expect(readExpandedStates(triggers)).toEqual(["true", "true"]);
    query.value = "";
    expect(readExpandedStates(triggers)).toEqual(["false", "true"]);
  });

  test("toggles a section while searching without saving it, and reopens it on the next query", () => {
    const { triggers, expanded, query } = setup({ expanded: createPreference<readonly string[]>(["gallery"]) });

    query.value = "o";
    triggers[0].click();
    expect(triggers[0].getAttribute("aria-expanded")).toBe("false");
    expect(expanded.value).toEqual(["gallery"]);
    query.value = "oo";
    expect(triggers[0].getAttribute("aria-expanded")).toBe("true");
  });

  test("stops following its preferences and query once disposed", () => {
    const hints = createPreference(false);
    const descriptors = [createSwitchSetting("hints", hints), createSwitchSetting("autoplay"), createSwitchSetting("loop")];
    const { element, triggers, expanded, query, dispose } = setup({ descriptors });

    dispose();
    expanded.set(["general"]);
    hints.set(true);
    query.value = "loop";
    expect(triggers[0].getAttribute("aria-expanded")).toBe("false");
    expect(element.querySelector("[role=switch]")?.getAttribute("aria-checked")).toBe("false");
    expect(readVisibleLabels(element)).toEqual(["hints", "autoplay", "loop"]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SettingsScreenClass, SCREEN_CSS);
  });
});
