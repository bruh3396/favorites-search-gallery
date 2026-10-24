import { describe, expect, test } from "vitest";
import { Readable, Signal } from "@/core/utils/reactive/signal";
import { SettingPreference } from "@/core/ui/settings/descriptor";
import { SettingsLayout } from "@/core/ui/settings/screen";
import { createSectionsToggleAction } from "@/core/ui/settings/sections_toggle";

const LAYOUT: SettingsLayout = [
  { id: "general", title: "General", settings: [] },
  { id: "layout", title: "Layout", settings: [] }
];

function createPreference(initial: readonly string[]): SettingPreference<readonly string[]> {
  const signal = new Signal(initial);
  return {
    get value(): readonly string[] {
      return signal.value;
    },
    peek: (): readonly string[] => signal.peek(),
    set(value: readonly string[]): void {
      signal.value = value;
    }
  };
}

function read<T>(value: T | Readable<T>): T {
  return (value as Readable<T>).value;
}

describe("createSectionsToggleAction", () => {
  test("collapses every section while any is open", () => {
    const expanded = createPreference(["general"]);
    const action = createSectionsToggleAction(LAYOUT, expanded);

    expect([read(action.label), read(action.icon)]).toEqual(["Collapse all", "collapseAll"]);
    action.onClick();
    expect(expanded.value).toEqual([]);
  });

  test("expands every section once all are collapsed", () => {
    const expanded = createPreference([]);
    const action = createSectionsToggleAction(LAYOUT, expanded);

    expect([read(action.label), read(action.icon)]).toEqual(["Expand all", "expandAll"]);
    action.onClick();
    expect(expanded.value).toEqual(["general", "layout"]);
  });

  test("ignores open ids the layout doesn't name", () => {
    const action = createSectionsToggleAction(LAYOUT, createPreference(["gone"]));

    expect(read(action.label)).toBe("Expand all");
  });
});
