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
    set(value: T): void {
      signal.value = value;
    }
  };
}

function createSwitchSetting(id: string, preference = createPreference(false)): SwitchSetting {
  return { id, kind: "switch", label: id, preference };
}

function setup(options: Partial<SettingsScreenOptions> = {}): SettingsScreen & {
  expanded: SettingPreference<readonly string[]>;
  triggers: HTMLButtonElement[];
} {
  const expanded = options.expanded ?? createPreference<readonly string[]>([]);
  const descriptors = ["autoplay", "hints", "loop"].map(id => createSwitchSetting(id));
  const screen = createSettingsScreen(document, { layout: LAYOUT, descriptors, expanded, scheduler: SCHEDULER, ...options });
  return { ...screen, expanded, triggers: [...screen.element.querySelectorAll<HTMLButtonElement>("[aria-expanded]")] };
}

function readLabels(element: HTMLElement): string[] {
  return [...element.querySelectorAll(".fsg-SettingRow-label")].map(label => label.textContent ?? "");
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
    const readExpandedStates = (): (string | null)[] => triggers.map(trigger => trigger.getAttribute("aria-expanded"));

    expect(readExpandedStates()).toEqual(["false", "true"]);
    expanded.set(["general"]);
    expect(readExpandedStates()).toEqual(["true", "false"]);
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

  test("hides and shows every caption on request", () => {
    const descriptors = ["autoplay", "hints", "loop"].map(id => ({ ...createSwitchSetting(id), description: `About ${id}.` }));
    const { element, setDescriptionsVisible } = setup({ descriptors });
    const captions = [...element.querySelectorAll<HTMLElement>(".fsg-SettingRow-description")];
    const readDescriptionHiddenStates = (): boolean[] => captions.map(caption => caption.hidden);

    setDescriptionsVisible(false);
    expect(readDescriptionHiddenStates()).toEqual([true, true, true]);
    setDescriptionsVisible(true);
    expect(readDescriptionHiddenStates()).toEqual([false, false, false]);
  });

  test("stops following its preferences once disposed", () => {
    const hints = createPreference(false);
    const descriptors = [createSwitchSetting("hints", hints), createSwitchSetting("autoplay"), createSwitchSetting("loop")];
    const { element, triggers, expanded, dispose } = setup({ descriptors });

    dispose();
    expanded.set(["general"]);
    hints.set(true);
    expect(triggers[0].getAttribute("aria-expanded")).toBe("false");
    expect(element.querySelector("[role=switch]")?.getAttribute("aria-checked")).toBe("false");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SettingsScreenClass, SCREEN_CSS);
  });
});
