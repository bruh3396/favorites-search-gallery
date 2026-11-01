import { SettingPreference } from "@/core/ui/settings/setting_preference";
import { SwitchSettingDescriptor } from "@/core/ui/settings/setting_descriptor";
import { SettingsLayout } from "@/core/ui/settings/settings_layout";
import { SettingsScreen, SettingsScreenClass, SettingsScreenProps } from "@/core/ui/settings/settings_screen";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import SCREEN_CSS from "@/core/ui/settings/settings_screen.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

const SCHEDULER = { schedule: (): (() => void) => () => undefined };

const LAYOUT: SettingsLayout = [
  { id: "general", title: "General", settings: ["hints", "autoplay"] },
  { id: "empty", title: "Empty", settings: [] },
  { id: "gallery", title: "Gallery", settings: ["loop"] }
];

function createStoredValue<T>(initial: T): SettingPreference<T> {
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

function createSwitchSetting(id: string, settingPreference = createStoredValue(false)): SwitchSettingDescriptor {
  return { id, kind: "switch", label: id, settingPreference };
}

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  query: Signal<string>;
  sections: HTMLElement[];
}

function setup(partialSettingsScreenProps: Partial<SettingsScreenProps> = {}): Setup {
  const query = new Signal("");
  const switchSettingDescriptors = ["autoplay", "hints", "loop"].map(id => createSwitchSetting(id));
  const { result: element, dispose } = render(document, () => (
    <SettingsScreen settingsLayout={LAYOUT} settingDescriptors={switchSettingDescriptors} query={query} stepperScheduler={SCHEDULER} {...partialSettingsScreenProps} />
  ));
  return { element, dispose, query, sections: [...element.querySelectorAll<HTMLElement>("section")] };
}

function readLabels(element: HTMLElement): string[] {
  return [...element.querySelectorAll(".fsg-SettingRow-label")].map(label => label.textContent ?? "");
}

function readVisibleLabels(element: HTMLElement): string[] {
  return [...element.querySelectorAll<HTMLElement>(".fsg-SettingRow")]
    .filter(row => !row.hidden)
    .map(row => row.querySelector(".fsg-SettingRow-label")?.textContent ?? "");
}

describe("SettingsScreen", () => {
  test("draws each section in layout order, its rows in the order it lists them", () => {
    const { sections, element } = setup();

    expect(sections.map(section => section.ariaLabelledByElements?.[0].textContent)).toEqual(["General", "Gallery"]);
    expect(readLabels(element)).toEqual(["hints", "autoplay", "loop"]);
  });

  test("leaves out a section with no settings", () => {
    const { element } = setup();

    expect(element.textContent).not.toContain("Empty");
  });

  test("refuses a layout that names a setting with no descriptor", () => {
    expect(() => setup({ settingsLayout: [{ id: "general", title: "General", settings: ["missing"] }] })).toThrow("\"missing\"");
  });

  test("draws sections and rows at the host's size", () => {
    const { element } = setup({ controlSize: "small" });
    const sizes = [...element.querySelectorAll<HTMLElement>("[data-size]")].map(sized => sized.dataset.size);

    expect(new Set([element.dataset.size, ...sizes])).toEqual(new Set(["small"]));
  });

  test("hides and shows every caption as told", () => {
    const descriptors = ["autoplay", "hints", "loop"].map(id => ({ ...createSwitchSetting(id), description: `About ${id}.` }));
    const descriptionsVisible = new Signal(false);
    const { element } = setup({ settingDescriptors: descriptors, descriptionsVisible });
    const captions = [...element.querySelectorAll<HTMLElement>(".fsg-SettingRow-description")];
    const readDescriptionHiddenStates = (): boolean[] => captions.map(caption => caption.hidden);

    expect(readDescriptionHiddenStates()).toEqual([true, true, true]);
    descriptionsVisible.value = true;
    expect(readDescriptionHiddenStates()).toEqual([false, false, false]);
  });

  test("shows only the rows a query matches, and only the sections holding one", () => {
    const { element, sections, query } = setup();

    query.value = "hints";
    expect(readVisibleLabels(element)).toEqual(["hints"]);
    expect(sections.map(section => section.hidden)).toEqual([false, true]);
  });

  test("shows every row when given no query", () => {
    const { element } = setup({ query: undefined });

    expect(readVisibleLabels(element)).toEqual(["hints", "autoplay", "loop"]);
  });

  test("shows every row again when the query is cleared", () => {
    const { element, sections, query } = setup();

    query.value = "loop";
    query.value = "  ";
    expect(readVisibleLabels(element)).toEqual(["hints", "autoplay", "loop"]);
    expect(sections.map(section => section.hidden)).toEqual([false, false]);
  });

  test("stops following its preferences and query once disposed", () => {
    const settingPreference = createStoredValue(false);
    const switchSettingDescriptors = [createSwitchSetting("hints", settingPreference), createSwitchSetting("autoplay"), createSwitchSetting("loop")];
    const { element, query, dispose } = setup({ settingDescriptors: switchSettingDescriptors });

    dispose();
    settingPreference.set(true);
    query.value = "loop";
    expect(element.querySelector("[role=switch]")?.getAttribute("aria-checked")).toBe("false");
    expect(readVisibleLabels(element)).toEqual(["hints", "autoplay", "loop"]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SettingsScreenClass, SCREEN_CSS);
  });
});
