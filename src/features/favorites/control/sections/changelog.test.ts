import * as FavoritesChangelog from "@/features/favorites/control/sections/changelog";
import { describe, expect, test } from "vitest";
import { SettingsClass } from "@/lib/ui/settings/classes";

interface Setup {
  sections: HTMLElement[];
  collapseAll: HTMLElement;
}

function setup(): Setup {
  const container = document.createElement("div");
  const { mount, actions } = FavoritesChangelog.buildDrawerSection();

  mount?.(container);
  return {
    sections: [...container.querySelectorAll<HTMLElement>(`.${SettingsClass.section}`)],
    collapseAll: (actions ?? [])[0]
  };
}

function readVersion(section: HTMLElement): number[] {
  const title = section.querySelector(`.${SettingsClass.sectionTitle}`)?.textContent ?? "";
  return title.replace(/^v/u, "").split(".").map(Number);
}

function compareVersions(a: number[], b: number[]): number {
  const index = a.findIndex((part, i) => part !== b[i]);
  return index === -1 ? 0 : a[index] - b[index];
}

function readCollapsedStates(sections: HTMLElement[]): boolean[] {
  return sections.map(section => section.dataset.collapsed !== undefined);
}

function toggle(section: HTMLElement): void {
  (section.querySelector("button") as HTMLButtonElement).click();
}

describe("FavoritesChangelog", () => {
  test("lists releases newest first", () => {
    const versions = setup().sections.map(readVersion);

    expect(versions.length).toBeGreaterThan(1);
    expect([...versions].sort((a, b) => compareVersions(b, a))).toEqual(versions);
  });

  test("opens only the newest release", () => {
    const [isNewest, ...older] = readCollapsedStates(setup().sections);

    expect(isNewest).toBe(false);
    expect(older.every(Boolean)).toBe(true);
  });

  test("collapses every release on collapse all, then expands them all", () => {
    const { sections, collapseAll } = setup();

    collapseAll.click();
    expect(readCollapsedStates(sections).every(Boolean)).toBe(true);
    collapseAll.click();
    expect(readCollapsedStates(sections).some(Boolean)).toBe(false);
  });

  test("tracks releases opened and closed by hand in collapse all", () => {
    const { sections, collapseAll } = setup();

    toggle(sections[0]);
    expect(collapseAll.dataset.collapsed).toBeDefined();
    toggle(sections[1]);
    expect(collapseAll.dataset.collapsed).toBeUndefined();
  });
});
