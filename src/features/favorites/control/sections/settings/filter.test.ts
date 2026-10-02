import * as FavoritesSettingsFilter from "@/features/favorites/control/sections/settings/filter";
import { describe, expect, test } from "vitest";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { ToggleSetting } from "@/lib/ui/settings/setting";
import { buildCollapsibleSection } from "@/lib/ui/settings/components/section";
import { buildToggleRow } from "@/lib/ui/settings/components/toggle";
import { createElement } from "@/utils/browser/element";
import { segmented } from "@/lib/ui/settings/controls";

interface Setup {
  panel: HTMLElement;
  field: HTMLInputElement;
  hidden: HTMLElement;
  rows: Record<string, HTMLElement>;
  sections: Record<string, HTMLElement>;
}

function setup(): Setup {
  const rows = {
    darkMode: toggleRow({ label: "Dark Mode", tooltip: "Use dark variant of selected color theme" }),
    header: toggleRow({ label: "Site Header", tooltip: "Show site header" }),
    layout: segmented({ label: "Layout", tooltip: "Choose favorites layout", options: new Map([["column", "Waterfall"], ["grid", "Grid"]]) })(),
    autoplay: toggleRow({ label: "Autoplay", tooltip: "Automatically traverse gallery" })
  };
  const sections = {
    appearance: section("Appearance", [rows.darkMode, rows.header, rows.layout]),
    gallery: section("Gallery", [rows.autoplay])
  };
  const panel = document.createElement("div");
  const hidden = document.createElement("button");
  const filter = FavoritesSettingsFilter.inputFilter(panel, [hidden]);

  panel.append(filter, sections.appearance, sections.gallery);
  return { panel, field: filter.querySelector("input") as HTMLInputElement, hidden, rows, sections };
}

function toggleRow(config: Partial<ToggleSetting>): HTMLElement {
  return buildToggleRow(config, { onToggle: () => { } }).element;
}

function section(title: string, rows: HTMLElement[]): HTMLElement {
  return buildCollapsibleSection({ title, collapsed: false, children: rows, onToggle: () => { } });
}

function type(field: HTMLInputElement, text: string): void {
  field.value = text;
  field.dispatchEvent(new Event("input"));
}

function visibleOf(elements: Record<string, HTMLElement>): string[] {
  return Object.entries(elements).filter(([, element]) => element.dataset.filtered === undefined).map(([name]) => name);
}

function isFlagged(element: HTMLElement, flag: string): boolean {
  return element.dataset[flag] !== undefined;
}

describe("FavoritesSettingsFilter", () => {
  test("shows everything before anything is typed", () => {
    const { panel, rows, sections, hidden } = setup();

    expect(visibleOf(rows)).toEqual(["darkMode", "header", "layout", "autoplay"]);
    expect(visibleOf(sections)).toEqual(["appearance", "gallery"]);
    expect(isFlagged(panel, "filtering")).toBe(false);
    expect(isFlagged(hidden, "hidden")).toBe(false);
  });

  test("matches a setting by its label, ignoring case", () => {
    const { field, rows, sections } = setup();

    type(field, "DARK");
    expect(visibleOf(rows)).toEqual(["darkMode"]);
    expect(visibleOf(sections)).toEqual(["appearance"]);
  });

  test("matches a setting by its description and its options", () => {
    const { field, rows } = setup();

    type(field, "traverse");
    expect(visibleOf(rows)).toEqual(["autoplay"]);
    type(field, "waterfall");
    expect(visibleOf(rows)).toEqual(["layout"]);
  });

  test("matching a section's title shows all of its settings", () => {
    const { field, rows } = setup();

    type(field, "appearance");
    expect(visibleOf(rows)).toEqual(["darkMode", "header", "layout"]);
  });

  test("requires every typed word to match", () => {
    const { field, rows } = setup();

    type(field, "appearance  site");
    expect(visibleOf(rows)).toEqual(["header"]);
  });

  test("hides the given elements while filtering", () => {
    const { panel, field, hidden } = setup();

    type(field, "dark");
    expect(isFlagged(panel, "filtering")).toBe(true);
    expect(isFlagged(hidden, "hidden")).toBe(true);
  });

  test("says when nothing matches", () => {
    const { panel, field, sections } = setup();

    type(field, "nothing like this");
    expect(visibleOf(sections)).toEqual([]);
    expect(isFlagged(panel, "empty")).toBe(true);
  });

  test("matches untitled sections and unlabeled rows only by what they do have", () => {
    const { panel, field } = setup();
    const extra = { cherry: toggleRow({ label: "Cherry" }), unlabeled: createElement("div", { className: SettingsClass.row }) };

    panel.append(
      createElement("section", { className: SettingsClass.section, children: [extra.cherry] }),
      section("Mango", [extra.unlabeled])
    );
    type(field, "cherry");
    expect(visibleOf(extra)).toEqual(["cherry"]);
    type(field, "mango");
    expect(visibleOf(extra)).toEqual(["unlabeled"]);
  });

  test("clearing the search shows everything again", () => {
    const { panel, field, rows, hidden } = setup();

    type(field, "nothing like this");
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(visibleOf(rows)).toEqual(["darkMode", "header", "layout", "autoplay"]);
    expect(isFlagged(panel, "empty")).toBe(false);
    expect(isFlagged(hidden, "hidden")).toBe(false);
  });
});
