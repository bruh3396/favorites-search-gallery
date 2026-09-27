import * as FavoritesSettings from "@/features/favorites/control/sections/settings/settings";
import { describe, expect, test, vi } from "vitest";
import { AppContext } from "@/app/context/context";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { createAppContext } from "@/testing/context";

interface Setup {
  context: AppContext;
  container: HTMLElement;
  sections: Map<string, HTMLElement>;
  collapseAll: HTMLElement;
  reset: HTMLElement;
}

function setup(expanded: Record<string, boolean> = {}, onMobileDevice = false): Setup {
  const context = createAppContext({
    environment: { onMobileDevice, onDesktopDevice: !onMobileDevice },
    preferences: { favorites: { settingsExpandedSections: expanded } }
  });
  const container = document.createElement("div");
  const { mount, actions = [] } = FavoritesSettings.buildDrawerSection(context);
  const [collapseAll, reset] = actions;

  mount?.(container);
  return { context, container, sections: sectionsOf(container), collapseAll, reset };
}

function sectionsOf(container: HTMLElement): Map<string, HTMLElement> {
  return new Map([...container.querySelectorAll<HTMLElement>(`.${SettingsClass.section}`)].map(section => [
    section.querySelector(`.${SettingsClass.sectionTitle}`)?.textContent ?? "",
    section
  ]));
}

function openSectionsOf(sections: Map<string, HTMLElement>): string[] {
  return [...sections].filter(([, section]) => section.dataset.collapsed === undefined).map(([title]) => title);
}

function expandedOf(context: AppContext): Record<string, boolean> {
  return context.preferences.favorites.settingsExpandedSections.value;
}

describe("FavoritesSettings", () => {
  test("opens General by default and leaves the rest closed", () => {
    const { sections } = setup();

    expect(openSectionsOf(sections)).toEqual(["General"]);
  });

  test("opens the sections the user left open", () => {
    const { sections } = setup({ General: false, Layout: true });

    expect(openSectionsOf(sections)).toEqual(["Layout"]);
  });

  test("remembers a section being opened or closed", () => {
    const { context, sections } = setup();
    const header = (title: string): HTMLButtonElement => sections.get(title)?.querySelector("button") as HTMLButtonElement;

    header("Layout").click();
    header("General").click();
    expect(expandedOf(context)).toEqual({ Layout: true, General: false });
  });

  test("collapse all closes every section and remembers it, then opens them all", () => {
    const { context, sections, collapseAll } = setup();
    const titles = [...sections.keys()];

    collapseAll.click();
    expect(openSectionsOf(sections)).toEqual([]);
    expect(expandedOf(context)).toEqual(Object.fromEntries(titles.map(title => [title, false])));
    collapseAll.click();
    expect(openSectionsOf(sections)).toEqual(titles);
    expect(expandedOf(context)).toEqual(Object.fromEntries(titles.map(title => [title, true])));
  });

  test("the reset button asks for every setting to be reset", () => {
    const { context, reset } = setup();
    const requested = vi.fn();

    context.events.favorites.settingsResetRequested.on(requested);
    reset.click();
    expect(requested).toHaveBeenCalledOnce();
  });

  test("searching narrows the sections and hides collapse all", () => {
    const { container, sections, collapseAll } = setup();
    const field = container.querySelector(`.${SettingsClass.filter} input`) as HTMLInputElement;

    field.value = "dark mode";
    field.dispatchEvent(new Event("input"));
    expect([...sections].filter(([, section]) => section.dataset.filtered === undefined).map(([title]) => title)).toEqual(["Appearance"]);
    expect(collapseAll.dataset.hidden).toBeDefined();
  });

  test.each([["desktop", false], ["mobile", true]])("on %s, every section offers at least one setting", (_device, onMobileDevice) => {
    const { sections } = setup({}, onMobileDevice);

    expect(sections.size).toBeGreaterThan(0);

    for (const section of sections.values()) {
      expect(section.querySelectorAll(`.${SettingsClass.row}`).length).toBeGreaterThan(0);
    }
  });
});
