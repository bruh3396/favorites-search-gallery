import { SettingsScreen, SettingsScreenClass, SettingsScreenProps } from "@/core/ui/settings/settings_screen";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import SCREEN_CSS from "@/core/ui/settings/settings_screen.css?inline";
import { SettingDescriptor } from "@/core/ui/settings/setting_descriptor";
import { SettingPreference } from "@/core/ui/settings/setting_preference";
import { SettingsLayout } from "@/core/ui/settings/settings_layout";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

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

type SwitchSettingDescriptor = Extract<SettingDescriptor, { kind: "switch" }>;

function createSwitchSetting(id: string, settingPreference = createStoredValue(false)): SwitchSettingDescriptor {
  return { id, kind: "switch", label: id, settingPreference };
}

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  sections: HTMLElement[];
}

function setup(partialSettingsScreenProps: Partial<SettingsScreenProps> = {}): Setup {
  const switchSettingDescriptors = ["autoplay", "hints", "loop"].map(id => createSwitchSetting(id));
  const { result: element, dispose } = render(document, () => (
    <SettingsScreen settingsLayout={LAYOUT} settingDescriptors={switchSettingDescriptors} {...partialSettingsScreenProps} />
  ));
  return { element, dispose, sections: [...element.querySelectorAll<HTMLElement>("section")] };
}

function readLabels(element: HTMLElement): string[] {
  return [...element.querySelectorAll(".fsg-SettingRow-label")].map(label => label.textContent ?? "");
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

  test("stops following its preferences once disposed", () => {
    const settingPreference = createStoredValue(false);
    const switchSettingDescriptors = [createSwitchSetting("hints", settingPreference), createSwitchSetting("autoplay"), createSwitchSetting("loop")];
    const { element, dispose } = setup({ settingDescriptors: switchSettingDescriptors });

    dispose();
    settingPreference.set(true);
    expect(element.querySelector("[role=switch]")?.getAttribute("aria-checked")).toBe("false");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SettingsScreenClass, SCREEN_CSS);
  });
});
